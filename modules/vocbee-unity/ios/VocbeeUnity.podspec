require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'VocbeeUnity'
  s.version          = package['version']
  s.summary          = package['description']
  s.description      = package['description']
  s.license          = package['license']
  s.author           = package['author']
  s.homepage         = 'https://github.com/sturansahin/vocbee'
  s.platforms        = { :ios => '15.1' }
  s.swift_version    = '5.9'
  s.source           = { :git => 'https://github.com/sturansahin/vocbee.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.source_files = 'VocbeeUnityModule.swift'

  unity_xcframework = File.join(__dir__, 'UnityFramework.xcframework')
  unity_framework = File.join(__dir__, 'UnityFramework.framework')
  if File.directory?(unity_xcframework)
    s.vendored_frameworks = 'UnityFramework.xcframework'
  elsif File.directory?(unity_framework)
    s.vendored_frameworks = 'UnityFramework.framework'
  end
end
