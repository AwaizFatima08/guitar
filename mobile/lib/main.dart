import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'ads.dart';
import 'local_server.dart';
import 'shell.dart';

/// Geetar for Android: the Geetar web app (assets/web/) in a WebView, plus AdMob ads.
/// By HomiLabs. Dedicated to Pari.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final AdService ads = AdMobService();
  final server = LocalServer(bootJson: () => bootFor(prefs, ads));
  await server.start();
  runApp(GeetarApp(server: server, prefs: prefs, ads: ads));
}

class GeetarApp extends StatelessWidget {
  const GeetarApp({super.key, required this.server, required this.prefs, required this.ads});
  final LocalServer server;
  final SharedPreferences prefs;
  final AdService ads;

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Geetar',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(colorSchemeSeed: const Color(0xFFE2557D), useMaterial3: true),
        home: GeetarShell(server: server, prefs: prefs, ads: ads),
      );
}
