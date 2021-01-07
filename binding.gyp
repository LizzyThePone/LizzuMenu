{
  "targets": [
    {
      "target_name": "lizzyjs",
      "include_dirs" : [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "sources": [
        "main.cc",
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }
  ]
}
