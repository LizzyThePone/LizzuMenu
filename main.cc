#include <Windows.h>
#include <TlHelp32.h>
#include <iostream>
#include <string.h>
#include <psapi.h>
#include <napi.h>
#include <regex>

Napi::Value SetClanTag(const Napi::CallbackInfo& args) {
  Napi::Env env = args.Env();
  if (!args[0].IsNumber() && !args[1].IsNumber() && !args[2].IsString()) {
    Napi::Error::New(env, "first and second argument must be a number, third argument must be a string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string tagArg(args[2].As<Napi::String>().Utf8Value());
  const char* tag = tagArg.c_str();
  const char* name = "";
  HANDLE ProcessHandle = (HANDLE)args[0].As<Napi::Number>().Int64Value();
  DWORD address = args[1].As<Napi::Number>().Int64Value();

	unsigned char Shellcode[] =
		"\x51"                   
		"\x52"                  
		"\xB9\x00\x00\x00\x00"   
		"\xBA\x00\x00\x00\x00"   
		"\xE8\x00\x00\x00\x00"  
		"\x83\x04\x24\x0A"      
		"\x68\x00\x00\x00\x00"  
		"\xC3"          
		"\x5A"              
		"\x59"               
		"\xC3"
		"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00" 
		"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";

	unsigned int SHELLCODE_SIZE = sizeof(Shellcode) - 0x21;
	unsigned int TAG_SIZE = (strlen(tag) > 15) ? 15 : strlen(tag);
	unsigned int NAME_SIZE = (strlen(name) > 15) ? 15 : strlen(name);
	unsigned int DATA_SIZE = TAG_SIZE + NAME_SIZE + 2;

	LPVOID ShellCodeAddress = VirtualAllocEx(ProcessHandle,
		0,
		SHELLCODE_SIZE + DATA_SIZE,
		MEM_COMMIT | MEM_RESERVE,
		PAGE_EXECUTE_READWRITE
		);

	DWORD dwTagAddress = (DWORD)ShellCodeAddress + SHELLCODE_SIZE;
	DWORD dwNameAddress = (DWORD)ShellCodeAddress + SHELLCODE_SIZE + TAG_SIZE + 1;
	DWORD dwSetClanAddress = address; 

	memcpy(Shellcode + 0x3, &dwTagAddress, sizeof(DWORD));
	memcpy(Shellcode + 0x8, &dwNameAddress, sizeof(DWORD));
	memcpy(Shellcode + 0x16, &dwSetClanAddress, sizeof(DWORD));
	memcpy(Shellcode + SHELLCODE_SIZE, tag, TAG_SIZE);
	memcpy(Shellcode + SHELLCODE_SIZE + TAG_SIZE + 1, name, NAME_SIZE);

	WriteProcessMemory(ProcessHandle, ShellCodeAddress, Shellcode, SHELLCODE_SIZE + DATA_SIZE, 0);

	HANDLE hThread = CreateRemoteThread(ProcessHandle, NULL, NULL, (LPTHREAD_START_ROUTINE)ShellCodeAddress, NULL, NULL, NULL);
	WaitForSingleObject(hThread, INFINITE);
	VirtualFreeEx(ProcessHandle, ShellCodeAddress, 0, MEM_RELEASE);

  return env.Null();
}

HANDLE g_process_handle;

auto get_module(const char* modName, DWORD proc_id) {
	HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, proc_id);
	if (hSnap != INVALID_HANDLE_VALUE) {
		MODULEENTRY32 modEntry;
		modEntry.dwSize = sizeof(modEntry);
		if (Module32First(hSnap, &modEntry)) {
			do {
				if (!strcmp((char*)modEntry.szModule, modName)) {
					CloseHandle(hSnap);
					return modEntry;
				}
			} while (Module32Next(hSnap, &modEntry));
		}
	}
	return MODULEENTRY32();
}

template<typename T> T RPM(SIZE_T address) {
	T buffer; ReadProcessMemory(g_process_handle, (void*)address, &buffer, sizeof(T), nullptr);
	return buffer;
}

void str_replace_all(std::string& subject, const std::string& search, const std::string& replace) {
	size_t pos = 0;
	while ((pos = subject.find(search, pos)) != std::string::npos) {
		subject.replace(pos, search.length(), replace);
		pos += replace.length();
	}
}

//now accepts ida-style, single and double question marks, lower case and uppercase
uintptr_t find_pattern(const MODULEENTRY32& module, const std::string& str, std::string ida, int offset, int extra, bool relative = true) {
	ida.insert(0, " ");
	std::transform(ida.begin(), ida.end(), ida.begin(), tolower);
	str_replace_all(ida, " ??", " ?");
	str_replace_all(ida, " ?", " ??");
	str_replace_all(ida, " ", "");

	std::string pattern;

	for (unsigned int i = 0; i < ida.size(); i += 2) {
		std::string word = ida.substr(i, 2);
		if (word == "??") pattern += ".";
		else pattern += (char)strtol(word.c_str(), NULL, 16);
	}

	uintptr_t address;
	std::smatch sm;
	std::regex_search(str, sm, std::regex(pattern));

	if (sm.size() == 0) return 0x0;
	else address = sm.position(0);

	address += (uintptr_t)module.modBaseAddr + offset;
	address = RPM<uint32_t>(address) + extra;
	return relative ? address - (uintptr_t)module.modBaseAddr : address;
}

/*
Napi::Value Scan(const Napi::CallbackInfo& args) {
	Napi::Env env = args.Env();

  	if (!args[0].IsNumber() && !args[1].IsString() && !args[2].IsString() && !args[3].IsNumber() && !args[4].IsNumber()) {
    	Napi::Error::New(env, "first and second argument must be a number, third argument must be a string").ThrowAsJavaScriptException();
    	return env.Null();
  	}

	DWORD proc_id = args[0].As<Napi::Number>().Int64Value();
	g_process_handle = OpenProcess(PROCESS_VM_READ, false, proc_id);

	const char* modName = args[1].As<Napi::String>().Utf8Value().c_str();
	auto module = get_module(modName, proc_id);

	const char* pattern = args[2].As<Napi::String>().Utf8Value().c_str();

	int patternOffset = args[3].As<Napi::Number>().Int64Value();

	int addressOffset = args[4].As<Napi::Number>().Int64Value();

	std::string bytes(module.modBaseSize, ' ');
	ReadProcessMemory(g_process_handle, (void*)module.modBaseAddr, (void*)bytes.data(), module.modBaseSize, nullptr);

	auto result = find_pattern(module, bytes, pattern, patternOffset, addressOffset);

	Napi::Number num = Napi::Number::New(env, result);

  	return num;
}*/

Napi::Value ClientScan(const Napi::CallbackInfo& args) {
	Napi::Env env = args.Env();

	/*
  	if (!args[0].IsNumber() && !args[1].IsString() && !args[2].IsString() && !args[3].IsNumber() && !args[4].IsNumber()) {
    	Napi::Error::New(env, "first and second argument must be a number, third argument must be a string").ThrowAsJavaScriptException();
    	return env.Null();
  	}*/

	auto hwnd = FindWindow(NULL, (LPCSTR)"Counter-Strike: Global Offensive");
	DWORD proc_id; GetWindowThreadProcessId(hwnd, &proc_id);
	g_process_handle = OpenProcess(PROCESS_VM_READ, false, proc_id);
	auto module = get_module("client.dll", proc_id);
	const char* pattern = args[0].As<Napi::String>().Utf8Value().c_str();
	int patternOffset = args[1].As<Napi::Number>().Int64Value();
	int addressOffset = args[2].As<Napi::Number>().Int64Value();

	std::string bytes(module.modBaseSize, ' ');
	ReadProcessMemory(g_process_handle, (void*)module.modBaseAddr, (void*)bytes.data(), module.modBaseSize, nullptr);

	auto result = find_pattern(module, bytes, pattern, patternOffset, addressOffset);

	Napi::Number num = Napi::Number::New(env, result);

  	return num;
}

Napi::Value EngineScan(const Napi::CallbackInfo& args) {
	Napi::Env env = args.Env();

	/*
  	if (!args[0].IsNumber() && !args[1].IsString() && !args[2].IsString() && !args[3].IsNumber() && !args[4].IsNumber()) {
    	Napi::Error::New(env, "first and second argument must be a number, third argument must be a string").ThrowAsJavaScriptException();
    	return env.Null();
  	}*/

	auto hwnd = FindWindow(NULL, (LPCSTR)"Counter-Strike: Global Offensive");
	DWORD proc_id; GetWindowThreadProcessId(hwnd, &proc_id);
	g_process_handle = OpenProcess(PROCESS_VM_READ, false, proc_id);
	auto module = get_module("engine.dll", proc_id);
	const char* pattern = args[0].As<Napi::String>().Utf8Value().c_str();
	int patternOffset = args[1].As<Napi::Number>().Int64Value();
	int addressOffset = args[2].As<Napi::Number>().Int64Value();

	std::string bytes(module.modBaseSize, ' ');
	ReadProcessMemory(g_process_handle, (void*)module.modBaseAddr, (void*)bytes.data(), module.modBaseSize, nullptr);

	auto result = find_pattern(module, bytes, pattern, patternOffset, addressOffset);

	Napi::Number num = Napi::Number::New(env, result);

  	return num;
}

#pragma pack(push,1)
struct ClientCmd_Unrestricted_t
{
	char*	command;
	bool	delay;
};
#pragma pack(pop)

Napi::Value Console(const Napi::CallbackInfo& callArgs) {
	Napi::Env env = callArgs.Env();

  	if (!callArgs[0].IsNumber() && !callArgs[1].IsNumber() && !callArgs[2].IsString()) {
    	Napi::Error::New(env, "first and second argument must be a number, third argument must be a string").ThrowAsJavaScriptException();
    	return env.Null();
  	}

	std::string commandArg(callArgs[2].As<Napi::String>().Utf8Value() + "\0");
  	const char* command = commandArg.c_str();
  	HANDLE ProcessHandle = (HANDLE)callArgs[0].As<Napi::Number>().Int64Value();
  	DWORD address = callArgs[1].As<Napi::Number>().Int64Value();
	ClientCmd_Unrestricted_t args;
 
	strcpy(args.command, command);
	args.delay = false;
 
 
	LPVOID addr = (LPVOID)address;
	LPVOID vArgs = (LPVOID)VirtualAllocEx(ProcessHandle, NULL, sizeof(args), MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);
	WriteProcessMemory(ProcessHandle, vArgs, (LPCVOID)&args, sizeof(args), NULL);
	HANDLE hThread = CreateRemoteThread(ProcessHandle, NULL, NULL, (LPTHREAD_START_ROUTINE)addr, vArgs, NULL, NULL);
	WaitForSingleObject(hThread, INFINITE);
	VirtualFreeEx(ProcessHandle, vArgs, sizeof(args), MEM_RELEASE);
	CloseHandle(hThread);

	Napi::Number num = Napi::Number::New(env, reinterpret_cast<DWORD>(addr));
	return num;
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "setClanTag"), Napi::Function::New(env, SetClanTag));
  exports.Set(Napi::String::New(env, "console"), Napi::Function::New(env, Console));
  exports.Set(Napi::String::New(env, "clientScan"), Napi::Function::New(env, ClientScan));
  exports.Set(Napi::String::New(env, "engineScan"), Napi::Function::New(env, EngineScan));
  //exports.Set(Napi::String::New(env, "aim"), Napi::Function::New(env, Aim));
  return exports;
}

NODE_API_MODULE(lizzyjs, init)