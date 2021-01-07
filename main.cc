#include <windows.h>
#include <psapi.h>
#include "main.h"

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


Napi::Object init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "setClanTag"), Napi::Function::New(env, SetClanTag));
  return exports;
}

NODE_API_MODULE(lizzyjs, init)