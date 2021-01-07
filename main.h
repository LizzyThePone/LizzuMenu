#include <napi.h>

namespace functionexample {
  Napi::Value SetClanTag(const Napi::CallbackInfo& info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
}