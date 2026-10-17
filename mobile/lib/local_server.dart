import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/services.dart';

/// Serves the bundled Geetar web app (assets/web/) on 127.0.0.1.
///
/// Why a local server: the web app uses JavaScript modules and the microphone, which need a
/// real http origin (file:// blocks modules). 127.0.0.1 counts as a secure origin, so
/// getUserMedia works. A fixed port keeps the origin, and so the WebView's storage, stable.
class LocalServer {
  LocalServer({required this.bootJson, AssetBundle? bundle}) : _bundle = bundle ?? rootBundle;

  /// Returns the boot file for the page: saved progress and app settings.
  final String Function() bootJson;
  final AssetBundle _bundle;

  static const ports = [47391, 47392, 47393, 47394, 47395];

  /// Random per-launch token. The boot file (which holds the learner's name and progress) is only
  /// served with it, so other apps on the phone cannot read it from the port.
  final String token = List.generate(24, (_) => Random.secure().nextInt(36).toRadixString(36)).join();

  HttpServer? _server;
  int get port => _server!.port;
  String get origin => 'http://127.0.0.1:$port';
  Uri get startUri => Uri.parse('$origin/index.html?t=$token');

  Future<void> start() async {
    Object? lastError;
    for (final p in ports) {
      try {
        _server = await HttpServer.bind(InternetAddress.loopbackIPv4, p);
        break;
      } on SocketException catch (e) {
        lastError = e;
      }
    }
    _server ??= await HttpServer.bind(InternetAddress.loopbackIPv4, 0).catchError((_) => throw lastError!);
    _server!.listen(_handle);
  }

  Future<void> close() async => _server?.close(force: true);

  static const _types = {
    'html': 'text/html; charset=utf-8',
    'js': 'text/javascript; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'webmanifest': 'application/manifest+json',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'ico': 'image/x-icon',
  };

  static String contentType(String path) {
    final dot = path.lastIndexOf('.');
    return _types[dot < 0 ? '' : path.substring(dot + 1).toLowerCase()] ?? 'application/octet-stream';
  }

  Future<void> _handle(HttpRequest req) async {
    final res = req.response;
    res.headers.set('Cache-Control', 'no-cache');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method != 'GET' && req.method != 'HEAD') {
        res.statusCode = HttpStatus.methodNotAllowed;
        return;
      }
      var path = Uri.decodeComponent(req.uri.path);
      if (path == '/__geetar/boot.json') {
        if (req.uri.queryParameters['t'] != token) {
          res.statusCode = HttpStatus.forbidden;
          return;
        }
        res.headers.contentType = ContentType.json;
        res.write(bootJson());
        return;
      }
      if (path.isEmpty || path == '/') path = '/index.html';
      if (path.contains('..')) {
        res.statusCode = HttpStatus.badRequest;
        return;
      }
      final ByteData data;
      try {
        data = await _bundle.load('assets/web$path');
      } on Object {
        res.statusCode = HttpStatus.notFound;
        res.write('Not found');
        return;
      }
      res.headers.set('Content-Type', contentType(path));
      res.add(data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes));
    } finally {
      await res.close();
    }
  }

  /// Builds the boot file. Kept static and pure for tests.
  static String buildBoot({required String? state, required bool ads, required bool privacyOptions, required String version}) =>
      jsonEncode({
        'app': {'ads': ads, 'privacyOptions': privacyOptions, 'version': version, 'platform': 'android'},
        'state': state,
      });
}
