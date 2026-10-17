import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geetar/ads.dart';
import 'package:geetar/local_server.dart';
import 'package:geetar/shell.dart';

class _FakeBundle extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) async {
    if (key == 'assets/web/index.html') return ByteData.sublistView(Uint8List.fromList(utf8.encode('<h1>Geetar</h1>')));
    throw StateError('missing $key');
  }
}

void main() {
  group('InterstitialPolicy', () {
    const p = InterstitialPolicy();
    final t0 = DateTime(2026, 10, 18, 10);
    test('never after the first lesson of the day', () {
      expect(p.shouldShow(lessonsDoneToday: 1, lessonsSinceLastAd: 5, now: t0, lastShown: null), isFalse);
    });
    test('at most one per two lessons', () {
      expect(p.shouldShow(lessonsDoneToday: 2, lessonsSinceLastAd: 1, now: t0, lastShown: null), isFalse);
      expect(p.shouldShow(lessonsDoneToday: 2, lessonsSinceLastAd: 2, now: t0, lastShown: null), isTrue);
    });
    test('at least four minutes apart', () {
      final last = t0.subtract(const Duration(minutes: 3));
      expect(p.shouldShow(lessonsDoneToday: 4, lessonsSinceLastAd: 2, now: t0, lastShown: last), isFalse);
      expect(p.shouldShow(lessonsDoneToday: 4, lessonsSinceLastAd: 2, now: t0.add(const Duration(minutes: 2)), lastShown: last), isTrue);
    });
  });

  group('BridgeMessage', () {
    test('parses known messages', () {
      expect(BridgeMessage.parse('{"type":"save","state":"{}"}'), isA<SaveState>());
      final page = BridgeMessage.parse('{"type":"page","route":"#/","banner":true}');
      expect(page, isA<PageShown>());
      expect((page! as PageShown).banner, isTrue);
      expect((BridgeMessage.parse('{"type":"lessonDone","doneToday":3}')! as LessonDone).doneToday, 3);
    });
    test('ignores junk', () {
      expect(BridgeMessage.parse('not json'), isNull);
      expect(BridgeMessage.parse('{"type":"save"}'), isNull);
      expect(BridgeMessage.parse('[1,2]'), isNull);
    });
    test('external links are limited to HomiLabs sites and email', () {
      expect(isAllowedExternal('https://tools.homilabs.org/privacy#geetar'), isTrue);
      expect(isAllowedExternal('mailto:homilabs.smc@gmail.com'), isTrue);
      expect(isAllowedExternal('https://example.com'), isFalse);
      expect(isAllowedExternal('http://tools.homilabs.org'), isFalse);
    });
  });

  group('LocalServer', () {
    test('content types', () {
      expect(LocalServer.contentType('/js/app.js'), startsWith('text/javascript'));
      expect(LocalServer.contentType('/manifest.webmanifest'), 'application/manifest+json');
      expect(LocalServer.contentType('/img/icon.png'), 'image/png');
    });
    test('serves pages and guards the boot file with the token', () async {
      final s = LocalServer(bootJson: () => LocalServer.buildBoot(state: '{"name":"Pari"}', ads: true, privacyOptions: false, version: '1'), bundle: _FakeBundle());
      await s.start();
      final c = HttpClient();
      Future<(int, String)> get(String path) async {
        final r = await (await c.getUrl(Uri.parse('${s.origin}$path'))).close();
        return (r.statusCode, await r.transform(utf8.decoder).join());
      }
      expect(await get('/'), (200, '<h1>Geetar</h1>'));
      expect((await get('/nope.js')).$1, 404);
      expect((await get('/__geetar/boot.json?t=wrong')).$1, 403);
      final boot = await get('/__geetar/boot.json?t=${s.token}');
      expect(boot.$1, 200);
      expect(jsonDecode(boot.$2)['state'], '{"name":"Pari"}');
      c.close();
      await s.close();
    });
  });
}
