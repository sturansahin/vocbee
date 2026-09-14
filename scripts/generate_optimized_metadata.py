# -*- coding: utf-8 -*-
"""
VocBee App Store Metadata Generator & Optimizer
Generates store-ready, culturally adapted, high-intent ASO metadata across 23 locales.
"""

import os
import sys

BASE_DIR = r"c:\Users\Turan\Desktop\vocbee\fastlane\metadata"

LOCALES_DATA = {
    "en-US": {
        "name": "VocBee: Vocabulary Builder",
        "subtitle": "Flashcards & Word of the Day",
        "keywords": "learn,gre,sat,ielts,toefl,spanish,french,study,spaced,repetition,cards,language,esl,english,quiz",
        "description": """Supercharge your vocabulary and master new languages with VocBee! Whether you are preparing for exams like the GRE, SAT, TOEFL, or IELTS, or learning a new language from scratch, VocBee makes vocabulary acquisition fast, engaging, and unforgettable.

WHY CHOOSE VOCBEE?
Traditional vocabulary memorization is tedious. VocBee transforms vocabulary learning into an enjoyable, interactive experience combining gamification, spaced repetition, and cutting-edge AI context.

KEY FEATURES:

• Interactive Bee Runner Game
Turn study time into playtime! Fly your bee through dynamic lanes and match vocabulary words at high speed. Test your reflexes and reinforce your memory in an exciting arcade-style runner.

• Smart Flashcards & CEFR Levels
Master words progressively from Beginner (A1, A2) through Intermediate (B1, B2) to Advanced (C1). Swipe effortlessly to mark words as learned or review them later.

• AI-Powered Example Sentences & Real Context
Never memorize isolated words again. Get instant, natural example sentences and nuanced explanations tailored to help you speak with confidence.

• Crystal-Clear Audio Pronunciations
Listen to authentic native pronunciations for every word to refine your listening comprehension and accent.

• Spaced Repetition (SRS) & Daily Streaks
Science-backed spaced repetition ensures you review words right before you forget them. Keep your daily streak alive and watch your vocabulary flourish day after day.

• Support for 20+ Languages
Learn English, Spanish, French, German, Italian, Turkish, Japanese, Korean, Chinese, Arabic, Russian, Hindi, Portuguese, Vietnamese, Thai, Indonesian, Urdu, and more!

• Exam & Career Ready
Specially curated word lists for university exams, professional communication, and international standardized tests.

Start expanding your word power today with VocBee!

Terms of Use (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NEW Bee Runner Game: Match words and fly through lanes in our brand-new action learning mode!
• Enhanced AI-powered example sentences and rich contextual explanations.
• Smoother card swipe animations and improved audio pronunciation clarity.
• Overall performance improvements and bug fixes for seamless daily learning."""
    },

    "en-GB": {
        "name": "VocBee: Vocabulary Builder",
        "subtitle": "Language Flashcards & Words",
        "keywords": "learn,spanish,french,german,italian,gcse,ielts,revision,memory,study,daily,fluent,cards,speak",
        "description": """Expand your vocabulary effortlessly and master languages with VocBee. From preparing for IELTS, GCSEs, and university exams to learning Spanish, French, or German, VocBee delivers an intuitive and rewarding learning journey.

WHY VOCBEE?
VocBee blends cognitive science with thrilling gamification to help you remember words permanently.

KEY FEATURES:

• Bee Runner Arcade Game
Turn revision into play! Guide your bee through lanes to match definitions and words on the fly. Learning vocabulary has never been this exhilarating.

• CEFR Level-Based Flashcards (A1 to C1)
Progress smoothly from foundational words to sophisticated academic vocabulary. Swipe to organise your study stack.

• AI-Crafted Example Sentences
Understand words in authentic, everyday context with smart AI-generated sentences and usage notes.

• Native Audio Pronunciations
Perfect your British and international pronunciation with crisp, high-fidelity audio.

• Spaced Repetition & Habit Streaks
Retain vocabulary long-term with scientifically timed reviews and motivating daily streaks.

• 20+ World Languages
Study English, French, Spanish, German, Italian, Mandarin, Japanese, Arabic, and more.

Download VocBee today and discover a smarter way to master words!

Terms of Use (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NEW Bee Runner Game: Match vocabulary while flying through lanes in our new arcade mode!
• Upgraded AI example sentences with deeper contextual nuances.
• Refined gesture controls and audio playback performance.
• Bug fixes and speed enhancements."""
    },

    "en-CA": {
        "name": "VocBee: Learn Vocabulary",
        "subtitle": "Daily Flashcards & Languages",
        "keywords": "builder,words,french,spanish,cards,study,ielts,toefl,esl,memory,spaced,repetition,game,speak",
        "description": """Build a powerful vocabulary in English, French, Spanish, and over 20 languages with VocBee! Whether preparing for IELTS, CELPIP, or TOEFL, or enhancing everyday bilingual communication, VocBee is your ultimate vocabulary companion.

FEATURES:

• Bee Runner Word Game
Race through dynamic lanes and match vocabulary words. Reinforce your memory through fast-paced, engaging gameplay.

• Smart Flashcards (A1 to C1)
Structured vocabulary decks graded by CEFR standards. Swipe easily to master essential and advanced words.

• AI-Driven Sentence Examples
See every word in natural, contemporary sentences generated by advanced AI.

• Native Audio Pronunciation
Master correct accents and pronunciation with clear audio playback.

• Spaced Repetition & Streak Tracking
Optimize memory retention with scientifically timed reviews and track your daily learning consistency.

• Over 20 Languages Supported
Learn English, French, Spanish, German, Mandarin, Arabic, and many more.

Download VocBee today and elevate your language skills!

Terms of Use (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• Introducing the Bee Runner word game: match words while flying in real-time!
• Smarter AI sentence generation for authentic everyday context.
• Improved card swiping responsiveness and audio quality.
• General stability enhancements."""
    },

    "en-AU": {
        "name": "VocBee: Vocabulary Builder",
        "subtitle": "Daily Words & Flashcards",
        "keywords": "learn,language,japanese,spanish,french,ielts,study,cards,memory,games,quiz,speak,fluency,accent",
        "description": """Supercharge your vocabulary and language learning with VocBee. Whether you want to ace the IELTS, expand your English word bank, or learn Japanese, Spanish, or French, VocBee makes daily practice fast and fun.

HIGHLIGHTS:

• Bee Runner Action Game
Combine learning with fun! Fly your bee into the correct lanes to match vocabulary and sharpen recall under pressure.

• Level-Based Flashcards (A1 to C1)
Learn progressively from beginner basics to advanced vocabulary with seamless card swipes.

• AI-Powered Usage Examples
Learn how words are actually used in natural, real-life sentences created by intelligent AI.

• Clear Audio Pronunciation
Improve your listening and speech with high-quality audio pronunciation for every word.

• Spaced Repetition & Daily Streaks
Retain what you learn forever with automated review schedules and habit-forming daily streaks.

• 20+ Languages Available
Learn English, Japanese, Spanish, German, Italian, Mandarin, and more.

Start your learning journey with VocBee today!

Terms of Use (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• Brand-new Bee Runner mini-game: test your vocab skills in an arcade lane runner!
• Enhanced AI example sentences and contextual notes.
• Smoother animations and audio playback optimizations.
• Bug fixes and performance tuning."""
    },

    "tr": {
        "name": "VocBee: İngilizce Kelime Ezber",
        "subtitle": "Kartlarla YDS, TOEFL & Dil",
        "keywords": "öğrenme,yökdil,sözlük,pratik,hazırlık,test,flashcard,a1,c1,günlük,ders,konuşma,cümle",
        "description": """VocBee ile İngilizce kelime ezberlemek artık çok kolay, kalıcı ve eğlenceli! YDS, YÖKDİL, YKS-DİL, TOEFL, IELTS sınavlarına hazırlanırken veya günlük konuşma becerilerini geliştirirken ihtiyacınız olan tüm kelimeler VocBee'de.

NEDEN VOCBEE?
Kelimeleri tek tek ezberlemeye çalışmak yerine akıllı aralıklı tekrar (Spaced Repetition), görsel kartlar, oyunlaştırma ve yapay zeka destekli örnek cümlelerle kalıcı hafızanıza kaydedin.

ÖNE ÇIKAN ÖZELLİKLER:

• Arı Koşucu (Bee Runner) Kelime Oyunu
Sıkıcı ezberlere son! Arınızı doğru kelime şeridine uçurarak eşleştirmeleri yapın, reflekslerinizi ve kelime bilginizi aynı anda test edin.

• Seviyelere Göre Kelime Kartları (A1 - C1)
Başlangıç (A1) seviyesinden ileri akademik (C1) seviyeye kadar özenle seçilmiş kelime listeleri. Sağa ve sola kaydırarak kelimeleri kolayca öğrenin.

• Yapay Zeka Destekli Örnek Cümleler
Kelimeleri sadece anlamıyla değil, gerçek hayatta nasıl kullanıldığını gösteren yapay zeka üretimi doğal cümlelerle öğrenin.

• Doğru Telaffuz ve Dinleme
Her kelimenin ana dili seviyesindeki net sesli telaffuzunu dinleyerek telaffuzunuzu ve dinleme becerinizi geliştirin.

• Aralıklı Tekrar ve Günlük Seri (Streak)
Unutma eğrisini alt edin! Bilimsel aralıklı tekrar sistemi unutmaya başladığınız an kelimeleri önünüze getirir. Günlük seri sistemiyle çalışma disiplini kazanın.

• 20'den Fazla Dil Desteği
İngilizce başta olmak üzere İspanyolca, Almanca, Fransızca, İtalyanca, Rusça, Japonca, Korece, Arapça ve daha birçok dili öğrenin.

VocBee ile bugün kelime hazinenizi katlayın!

Kullanım Şartları (EULA): https://vocbee.online/terms/
Apple Standart EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Gizlilik Politikası: https://vocbee.online/privacypolicy/""",
        "release_notes": """• YENİ: Arı Koşucu (Bee Runner) kelime eşleştirme oyunu eklendi!
• Yapay zeka örnek cümleleri ve açıklamaları geliştirildi.
• Kart kaydırma akıcılığı ve sesli telaffuz kalitesi artırıldı.
• Performans iyileştirmeleri ve hata düzeltmeleri yapıldı."""
    },

    "de": {
        "name": "VocBee: Vokabeltrainer",
        "subtitle": "Englisch lernen & Wortschatz",
        "keywords": "karteikarten,spanisch,französisch,wörter,sprachen,grammatik,übung,gedächtnis,flashcards,toefl",
        "description": """Erweitere deinen Wortschatz spielerisch und effektiv mit VocBee! Ob für Schule, Beruf, Sprachzertifikate (TOEFL, IELTS, Cambridge) oder Reisen: Mit VocBee lernst du Englisch, Spanisch, Französisch und über 20 weitere Sprachen dauerhaft.

WARUM VOCBEE?
Vergiss mühsames Vokabelpauken. VocBee kombiniert wissenschaftlich fundierte Wiederholungen (Spaced Repetition) mit motivierender Gamification und intelligenter KI.

HIGHLIGHTS:

• Bee Runner Vokabelspiel
Lerne mit Action! Steuere deine Biene auf die richtige Spur, um passende Vokabeln im Flug zu matchen. So macht Wortschatztraining richtig Spaß.

• Karteikarten nach GER-Niveaustufen (A1 bis C1)
Vom Anfänger bis zum Fortgeschrittenen: Wische durch strukturierte Vokabelstapel und behalte deinen Lernfortschritt stets im Blick.

• KI-Beispielsätze im echten Kontext
Verstehe, wie Wörter wirklich verwendet werden. Erhalte sofort präzise Beispielsätze und Erklärungen durch moderne KI.

• Klare Audio-Aussprache
Höre dir die authentische muttersprachliche Aussprache jedes Wortes an und verbessere dein Hörverstehen.

• Spaced Repetition & Tägliche Streaks
Das intelligente Wiederholungssystem bringt Vokabeln genau dann zurück, wenn du sie kurz davor bist zu vergessen. Baue deine tägliche Serie auf!

• Über 20 Sprachen lernen
Englisch, Spanisch, Französisch, Italienisch, Türkisch, Japanisch, Koreanisch, Arabisch und viele mehr.

Starte jetzt mit VocBee und meistere neue Sprachen!

Nutzungsbedingungen (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Datenschutz: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NEU: Bee Runner Vokabel-Laufspiel für actionreiches Lernen!
• Verbesserte KI-Beispielsätze und Kontextbeschreibungen.
• Flüssigeres Wischen durch Vokabelkarten und optimierte Audioausgabe.
• Fehlerbehebungen und Performance-Optimierungen."""
    },

    "fr": {
        "name": "VocBee: Vocabulaire Anglais",
        "subtitle": "Apprendre l'anglais & cartes",
        "keywords": "mots,langues,espagnol,allemand,flashcards,toeic,toefl,mémoire,révision,parler,cours,exercices",
        "description": """Enrichissez votre vocabulaire et apprenez l'anglais, l'espagnol, l'allemand et plus de 20 langues avec VocBee ! Idéal pour préparer le TOEIC, le TOEFL ou pour progresser au quotidien avec plaisir.

POURQUOI VOCBEE ?
Fini l'apprentissage rébarbatif ! VocBee associe la répétition espacée, l'intelligence artificielle et un jeu d'action stimulant pour ancrer les mots dans votre mémoire à long terme.

FONCTIONNALITÉS CLÉS :

• Jeu d'action Bee Runner
Apprenez en vous amusant ! Pilotez votre abeille dans la bonne voie pour associer les mots à leur signification. Révisez à toute vitesse !

• Cartes mémoire par niveaux CECRL (A1 à C1)
Du niveau débutant au niveau bilingue avancé, parcourez des listes de vocabulaire ciblées d'un simple geste.

• Phrases d'exemples générées par IA
Découvrez chaque mot dans un contexte réel grâce à des exemples clairs et naturels rédigés par l'intelligence artificielle.

• Prononciation audio native
Écoutez la prononciation authentique de chaque terme pour perfectionner votre accent et votre écoute.

• Répétition espacée et séries quotidiennes
Ne perdez plus vos acquis grâce à notre algorithme de mémorisation scientifiquement prouvé. Restez motivé grâce aux séries quotidiennes.

• Plus de 20 langues disponibles
Anglais, espagnol, allemand, italien, portugais, japonais, coréen, arabe, russe, etc.

Téléchargez VocBee dès aujourd'hui et boostez votre vocabulaire !

Conditions d'utilisation (EULA) : https://vocbee.online/terms/
Apple Standard EULA : https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Politique de confidentialité : https://vocbee.online/privacypolicy/""",
        "release_notes": """• NOUVEAU : Jeu d'arcade Bee Runner pour réviser le vocabulaire en plein vol !
• Phrases d'exemples générées par IA plus riches et contextuelles.
• Fluidité accrue des cartes mémoire et clarté audio améliorée.
• Améliorations de performance et corrections de bugs."""
    },

    "fr-CA": {
        "name": "VocBee: Vocabulaire Anglais",
        "subtitle": "Cartes & Mots du Jour",
        "keywords": "apprendre,langues,espagnol,flashcards,mots,anglaise,étude,mémoire,cours,toeic,parler,pratique",
        "description": """Développez votre vocabulaire d'anglais, d'espagnol et de plus de 20 langues grâce à VocBee. Idéal pour réussir vos études, vos examens (TOEFL, TOEIC) et communiquer avec aisance au quotidien.

POINTS FORTS :

• Jeu éducatif Bee Runner
Associez les mots en temps réel en guidant votre abeille dans les bonnes trajectoires. Une façon dynamique et stimulante d'apprendre.

• Cartes d'apprentissage par niveaux (A1 à C1)
Glissez facilement sur les cartes pour assimiler du vocabulaire débutant jusqu'au niveau expert.

• Exemples contextualisés par IA
Comprenez l'usage réel de chaque mot grâce à des phrases d'exemples actuelles créées par l'intelligence artificielle.

• Prononciations audio précises
Améliorez votre accent et votre compréhension orale avec des voix authentiques.

• Répétition espacée & série de jours
Mémorisez durablement sans oublier grâce au calendrier de révision intelligent.

• Plus de 20 langues au choix
Anglais, espagnol, allemand, italien, japonais, mandarin, et bien d'autres.

Téléchargez VocBee et enrichissez vos compétences linguistiques !

Conditions (EULA) : https://vocbee.online/terms/
Apple Standard EULA : https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Confidentialité : https://vocbee.online/privacypolicy/""",
        "release_notes": """• NOUVEAU jeu Bee Runner : courez et associez le vocabulaire en temps réel !
• Phrases d'exemples par IA perfectionnées.
• Balayage des cartes plus fluide et audio optimisé.
• Corrections et gains de vitesse."""
    },

    "es-ES": {
        "name": "VocBee: Vocabulario Inglés",
        "subtitle": "Aprender inglés con tarjetas",
        "keywords": "palabras,idiomas,cambridge,b1,b2,c1,flashcards,estudiar,memorizar,frances,aleman,juegos,repaso",
        "description": """¡Aprende vocabulario en inglés y más de 20 idiomas de forma rápida, eficaz y entretenida con VocBee! Prepárate para exámenes oficiales (Cambridge B1/B2/C1, Aptis, TOEFL, IELTS) o mejora tu fluidez diaria.

¿POR QUÉ VOCBEE?
Olvídate de memorizar listas aburridas. VocBee combina el sistema de repetición espaciada, inteligencia artificial y un adictivo minijuego para que recuerdes cada palabra para siempre.

CARACTERÍSTICAS PRINCIPALES:

• Minijuego Bee Runner
¡Aprende jugando! Vuela con tu abeja hacia el carril correcto para emparejar palabras contra reloj. Un arcade divertido que acelera tu retención.

• Tarjetas de vocabulario por niveles MCER (A1 a C1)
Aprende paso a paso desde nivel básico hasta vocabulario avanzado. Desliza con comodidad para marcar palabras aprendidas.

• Frases de ejemplo con Inteligencia Artificial
Descubre cómo se usa cada término en situaciones reales con frases naturales creadas por IA.

• Pronunciación nativa de alta calidad
Escucha cada palabra pronunciada con nitidez para perfeccionar tu oído y tu acento.

• Repetición espaciada y rachas diarias
Vence la curva del olvido. El algoritmo inteligente te muestra las palabras justo antes de que las olvides. ¡Mantén viva tu racha!

• Más de 20 idiomas disponibles
Inglés, francés, alemán, italiano, portugués, japonés, coreano, árabe, ruso y más.

¡Descarga VocBee hoy mismo y multiplica tu vocabulario!

Términos de uso (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Política de privacidad: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NUEVO juego Bee Runner: ¡empareja palabras al vuelo en nuestro modo arcade!
• Frases de ejemplo con IA mejoradas con mayor contexto.
• Mayor fluidez al deslizar tarjetas y sonido perfeccionado.
• Mejoras generales de rendimiento y resolución de errores."""
    },

    "es-MX": {
        "name": "VocBee: Aprender Inglés",
        "subtitle": "Vocabulario y Tarjetas",
        "keywords": "palabras,idiomas,toefl,estudio,flashcards,memorizar,pronunciacion,facil,hablar,curso,juegos",
        "description": """Aumenta tu vocabulario en inglés, francés, alemán y más de 20 idiomas con VocBee. Ya sea para estudiar para el TOEFL, mejorar tu carrera profesional o viajar, VocBee hace que aprender sea fácil y divertido.

DESTACADOS:

• Juego de acción Bee Runner
¡Aprende mientras juegas! Dirige a tu abeja al carril correspondiente para conectar palabras y significados en segundos.

• Tarjetas interactivas por niveles (A1 a C1)
Desde lo más básico hasta inglés profesional y académico. Desliza hacia los lados para repasar a tu ritmo.

• Ejemplos reales generados por IA
Aprende frases cotidianas y naturales para hablar con soltura y seguridad.

• Audio y pronunciación nativa
Escucha cómo se pronuncia cada palabra para hablar con excelente acento.

• Repetición espaciada y racha de estudio
El sistema te recuerda las palabras en el momento exacto para que no las olvides nunca.

• 20+ idiomas para explorar
Inglés, español, portugués, italiano, japonés, alemán, coreano y muchos más.

¡Descarga VocBee y empieza a mejorar tu inglés hoy!

Términos (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacidad: https://vocbee.online/privacypolicy/""",
        "release_notes": """• ¡NUEVO minijuego Bee Runner para aprender vocabulario jugando!
• Frases con inteligencia artificial más inteligentes y útiles.
• Deslizamiento de tarjetas más suave y mejor sonido.
• Corrección de errores y optimización de velocidad."""
    },

    "it": {
        "name": "VocBee: Vocaboli Inglese",
        "subtitle": "Imparare l'inglese & parole",
        "keywords": "lingue,memorizzare,flashcard,carte,spagnolo,studio,facile,grammatica,esercizi,b1,b2,pronuncia",
        "description": """Arricchisci il tuo vocabolario e impara l'inglese, lo spagnolo, il tedesco e oltre 20 lingue con VocBee! Ideale per esami (TOEFL, IELTS, Cambridge), lavoro o viaggi.

PERCHÉ SCEGLIERE VOCBEE?
Basta con noiosi elenchi mnemonici! VocBee unisce la ripetizione spaziata, l'intelligenza artificiale e un divertente minigioco per fissare ogni vocabolo nella tua memoria a lungo termine.

CARATTERISTICHE PRINCIPALI:

• Minigioco Bee Runner
Impara giocando a tutta velocità! Fai volare la tua ape nella corsia giusta per abbinare parole e traduzioni al volo.

• Flashcard per livelli QCER (da A1 a C1)
Impara passo dopo passo, dai vocaboli elementari a quelli accademici. Scorri le carte per organizzare le tue sessioni di studio.

• Frasi d'esempio generate da IA
Comprendi il reale contesto d'uso di ogni parola grazie a frasi moderne e naturali create dall'intelligenza artificiale.

• Pronuncia audio madrelingua
Ascolta la pronuncia corretta di ogni vocabolo per perfezionare il tuo accento e la comprensione orale.

• Ripetizione spaziata e serie giornaliere
Rivedi le parole al momento ideale per non dimenticarle mai. Mantieni viva la tua serie di studio ogni giorno!

• Oltre 20 lingue disponibili
Inglese, spagnolo, francese, tedesco, portoghese, giapponese, coreano, arabo e tante altre.

Scarica VocBee oggi e porta il tuo vocabolario a un livello superiore!

Termini di utilizzo (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Informativa sulla privacy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NOVITÀ: Gioco Bee Runner per imparare nuovi vocaboli correndo tra le corsie!
• Frasi d'esempio generate con IA ancora più ricche e contestuali.
• Scorrimento delle flashcard più fluido e audio ottimizzato.
• Risoluzione di bug e miglioramenti generali delle prestazioni."""
    },

    "pt-BR": {
        "name": "VocBee: Vocabulário Inglês",
        "subtitle": "Aprender inglês com cartões",
        "keywords": "palavras,idiomas,flashcards,estudar,memorizar,iniciante,toefl,espanhol,pratica,jogos,exercicios",
        "description": """Turbine seu vocabulário de inglês e aprenda mais de 20 idiomas com o VocBee! Ideal para quem está se preparando para provas (TOEFL, IELTS), viagens, estudos ou para alavancar a carreira profissional.

POR QUE ESCOLHER O VOCBEE?
Aprender palavras não precisa ser chato. O VocBee combina repetição espaçada, inteligência artificial e jogos dinâmicos para fixar o vocabulário de verdade na sua memória.

RECURSOS PRINCIPAIS:

• Jogo Bee Runner
Aprenda enquanto joga! Voe com a abelhinha para a faixa correta e combine palavras em tempo recorde. Um jogo ágil que acelera sua memorização.

• Cartões de Vocabulário por Níveis (A1 a C1)
Do nível básico ao avançado acadêmico. Deslize facilmente para salvar palavras aprendidas ou revisar depois.

• Frases de Exemplo com Inteligência Artificial
Entenda o uso real de cada termo em frases naturais do dia a dia geradas por IA.

• Pronúncia Nativa em Áudio
Escute a pronúncia autêntica de cada palavra para treinar seu ouvido e falar com confiança.

• Repetição Espaçada e Ofensivas Diárias
Nosso algoritmo inteligente traz as palavras de volta na hora certa, antes de você esquecer. Mantenha sua sequência diária e crie um hábito consistente!

• Mais de 20 Idiomas Suportados
Inglês, espanhol, francês, alemão, italiano, japonês, coreano, mandarim, russo e muito mais.

Baixe o VocBee hoje mesmo e domine novos idiomas!

Termos de Uso (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Política de Privacidade: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NOVO minijogo Bee Runner: combine palavras enquanto voa pelas pistas!
• Frases de exemplo com IA mais inteligentes e naturais.
• Deslize de cartões mais rápido e áudio aprimorado.
• Correções de bugs e otimizações de performance."""
    },

    "pt-PT": {
        "name": "VocBee: Vocabulário Inglês",
        "subtitle": "Aprender inglês e línguas",
        "keywords": "palavras,cartões,memória,flashcards,estudar,cambridge,espanhol,francês,exercícios,dicionário",
        "description": """Desenvolva o seu vocabulário em inglês, espanhol, francês e em mais de 20 línguas com o VocBee! A aplicação perfeita para preparar exames internacionais (Cambridge, IELTS, TOEFL) ou comunicar com naturalidade.

DESTAQUES DO VOCBEE:

• Jogo Interativo Bee Runner
Transforme o estudo num jogo! Conduza a sua abelha até à faixa correta para associar vocabulário sob pressão de tempo.

• Cartões Didáticos por Níveis QECR (A1 a C1)
Aprenda progressivamente de principiante a avançado através de cartões simples e elegantes.

• Frases de Exemplo Criadas por IA
Descubra a aplicação prática de cada palavra em contextos reais e modernos.

• Áudio com Pronúncia Autêntica
Aperfeiçoe a sua compreensão auditiva e o seu sotaque com áudio nítido e profissional.

• Repetição Espaçada e Sequência Diária
Retenha o conhecimento a longo prazo com intervalos de revisão cientificamente comprovados.

• Mais de 20 Idiomas Disponíveis
Inglês, espanhol, alemão, italiano, japonês, árabe, entre outros.

Descarregue o VocBee agora e enriqueça o seu vocabulário!

Termos de Utilização (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Política de Privacidade: https://vocbee.online/privacypolicy/""",
        "release_notes": """• NOVO jogo Bee Runner: aprenda vocabulário a voar entre pistas!
• Frases de exemplo com IA mais ricas e contextuais.
• Maior fluidez nas animações dos cartões e melhorias no áudio.
• Correções de erros e melhorias de desempenho."""
    },

    "ru": {
        "name": "VocBee: Английские слова",
        "subtitle": "Учить английский и карточки",
        "keywords": "запас,словарь,память,тоэфл,айлтс,лексика,тест,b1,b2",
        "description": """Учите английские слова и более 20 языков быстро, эффективно и с удовольствием вместе с VocBee! Готовитесь ли вы к экзаменам (IELTS, TOEFL), планируете путешествие или хотите свободно общаться по работе — VocBee станет вашим лучшим помощником.

ПОЧЕМУ VOCBEE?
Забудьте о скучной зубрежке! VocBee объединяет интервальное повторение, интеллектуальные карточки, игровой процесс и примеры от искусственного интеллекта для гарантированного запоминания слов.

ГЛАВНЫЕ ВОЗМОЖНОСТИ:

• Игра Bee Runner
Учите слова в движении! Управляйте пчелой, выбирайте правильную полосу и сопоставляйте слова на лету. Динамичная аркада превращает учебу в захватывающую игру.

• Умные карточки по уровням CEFR (A1 - C1)
Осваивайте лексику шаг за шагом: от базовых слов до продвинутого академического уровня. Смахивайте карточки в одно касание.

• Примеры предложений от ИИ
Узнайте, как слова используются в реальной жизни, благодаря актуальным и живым примерам от искусственного интеллекта.

• Чистое аудиопроизношение
Слушайте правильное произношение каждого слова носителями языка для тренировки акцента и аудирования.

• Интервальные повторения и ударный режим
Умный алгоритм напоминает слова именно тогда, когда вы начинаете их забывать. Поддерживайте ежедневную серию занятий!

• Более 20 языков
Английский, немецкий, испанский, французский, итальянский, турецкий, китайский, японский, корейский, арабский и другие.

Начните учить слова с VocBee уже сегодня!

Условия использования (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Политика конфиденциальности: https://vocbee.online/privacypolicy/""",
        "release_notes": """• НОВАЯ игра Bee Runner: учите и сопоставляйте слова на лету в режиме аркады!
• Улучшенные примеры предложений и объяснения от нейросети.
• Более плавные свайпы карточек и улучшенное качество звука.
• Исправление ошибок и повышение быстродействия."""
    },

    "ja": {
        "name": "VocBee: 英単語アプリ・英語学習",
        "subtitle": "単語帳とTOEIC対策・毎日暗記",
        "keywords": "英検,TOEIC,単語,語彙,勉強,リスニング,高校英語,カード,受験,スピーキング",
        "description": """VocBee（ボクビー）で英単語や20以上の外国語を効率よく楽しくマスター！TOEIC、英検、大学受験対策から日常英会話、ビジネス英語まで、あなたの語彙力アップを強力にサポートします。

VocBeeが選ばれる理由
単なる丸暗記はもう終わり。VocBeeは脳科学に基づいた「分散学習（エビングハウスの忘却曲線）」、AIによる自然な例文生成、そして爽快なゲームプレイを融合し、記憶への確実な定着を実現します。

主な特徴：

• 爽快アクションゲーム「Bee Runner」
遊びながら単語を覚える！画面上を飛ぶミツバチを正しいレーンに導き、瞬時に単語と意味をマッチング。反射神経と語彙力を同時に鍛えられます。

• CEFR基準のレベル別単語カード（A1〜C1）
中学・高校基礎英語から難関大・ビジネスレベルまで網羅。スワイプ操作で直感的に「覚えた」「復習」を仕分けできます。

• AI生成による生きた例文と解説
単語単体ではなく、ネイティブが実際に使う自然な例文をAIが即座に提示。実践的な会話力が身につきます。

• ネイティブ音声による発音再生
すべての単語にクリアなネイティブ音声を収録。リスニング対策や発音矯正にも最適です。

• 忘却を防ぐ分散復習＆連続学習ストリーク
忘れかけた絶妙なタイミングでAIが復習を提案。毎日のストリーク（連続記録）機能で学習習慣が自然と身につきます。

• 20カ国語以上の多言語学習に対応
英語はもちろん、スペイン語、フランス語、ドイツ語、韓国語、中国語、イタリア語なども学習可能です。

今すぐVocBeeをダウンロードして、新しい語彙の世界へ飛び込みましょう！

利用規約 (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
プライバシーポリシー: https://vocbee.online/privacypolicy/""",
        "release_notes": """• 新機能「Bee Runner」登場：レーンを飛んで単語を素早くマッチングする爽快英単語ランゲーム！
• AI例文生成機能がパワーアップし、より自然で実践的な表現に対応しました。
• 単語カードのスワイプ操作感および音声再生の品質を向上。
• パフォーマンスの改善および軽微な不具合の修正を行いました。"""
    },

    "ko": {
        "name": "VocBee: 영단어 단어장",
        "subtitle": "토익 영어공부 & 매일 단어 암기",
        "keywords": "어휘,플래시카드,수능,영어회화,보카,토플,공무원영어,공부,기억,스피킹",
        "description": """VocBee(복비)와 함께 쉽고 빠르게 영단어를 정복하세요! 토익(TOEIC), 수능, 토플(TOEFL), 공무원 영어, 일상 영어회화까지 모든 필수 어휘를 가장 효과적으로 암기할 수 있습니다.

왜 VocBee인가요?
단순히 눈으로만 보는 지루한 암기는 이제 그만! VocBee는 뇌과학 기반의 간격 반복(Spaced Repetition), 직관적인 플래시카드, AI 예문 생성, 그리고 신나는 액션 러닝 게임을 결합하여 단어를 장기 기억으로 전환합니다.

주요 핵심 기능:

• 신나는 단어 매칭 러너 게임 (Bee Runner)
공부가 게임이 되는 순간! 날아가는 꿀벌을 올바른 레인으로 유도하여 순발력 있게 단어를 매칭하세요. 즐겁게 플레이하며 암기 효과를 극대화합니다.

• CEFR 레벨별 맞춤 단어장 (A1 ~ C1)
기초 영단어부터 심화 고급 어휘까지 체계적으로 구성된 단어 카드를 좌우 스와이프로 간편하게 학습하세요.

• 최첨단 AI 기반 맞춤 예문 및 설명
단어만 외우지 마세요! 원어민이 실제 사용하는 생생하고 자연스러운 예문을 AI가 실시간으로 제공합니다.

• 원어민 고음질 오디오 발음
원어민 발음을 직접 들으며 리스닝과 스피킹을 동시에 다듬으세요.

• 망각 방지 간격 반복 시스템 & 데일리 스트릭
까먹을 때쯤 다시 보여주는 스마트 복습 알고리즘과 매일매일 이어가는 연속 학습 스트릭으로 학습 습관을 형성하세요.

• 20개 이상의 글로벌 언어 지원
영어뿐만 아니라 일본어, 중국어, 스페인어, 프랑스어, 독일어 등 다양한 외국어를 한 앱에서 배울 수 있습니다.

지금 VocBee를 다운로드하고 어휘력의 새로운 차원을 경험하세요!

이용약관 (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
개인정보 처리방침: https://vocbee.online/privacypolicy/""",
        "release_notes": """• 신규 기능: 신나는 단어 맞추기 아케이드 게임 'Bee Runner' 추가!
• AI 기반 예문 생성 및 문맥 설명 기능 강화.
• 카드 넘김 반응 속도 개선 및 오디오 발음 품질 최적화.
• 안정성 향상 및 버그 수정."""
    },

    "zh-Hans": {
        "name": "VocBee: 背单词・英语学习与单词本",
        "subtitle": "雅思托福词汇与四六级记忆卡片",
        "keywords": "考研英语,英语听力,口语,外语,复习,多语言,单词卡,天天背,词汇量",
        "description": """VocBee 是一款高效、有趣的背单词与语言学习应用！无论是备考雅思 (IELTS)、托福 (TOEFL)、大学英语四六级 (CET-4/6)、考研英语，还是提升日常英语口语，VocBee 都能帮你快速扩充词汇量。

为什么选择 VocBee？
告别枯燥的死记硬背！VocBee 融合了艾宾浩斯间隔重复记忆算法、生动的抽认卡交互、AI 智能例句解析以及趣味横生的飞行消除小游戏，让背单词变得轻松且持久。

核心功能亮点：

• 趣味小蜜蜂跑酷游戏（Bee Runner）
将背单词融入精彩游戏！操控你的小蜜蜂飞入正确轨道，在飞驰中快速匹配单词与释义，极速加深记忆印象。

• CEFR 科学分级词汇卡片（A1 至 C1）
从零基础入门到高阶学术词汇，卡片分类清晰。只需轻轻左右滑动，即可轻松标记已掌握与待复习单词。

• AI 智能生成实用真实例句
不背孤立生词！AI 为每个单词量身打造贴近真实生活的地道例句与用法解析，助你学以致用。

• 母语级纯正真人发音
清晰流畅的原声发音，助你练就纯正口音，同步提升听力与口语表达能力。

• 科学间隔重复与连续打卡（Streak）
在即将遗忘的临界点精准推送复习，建立每日学习习惯，见证词汇量每天稳步攀升。

• 支持全球 20+ 种主流语言
除英语外，还支持学习西班牙语、法语、德语、日语、韩语、俄语、意大利语等众多语种。

立即下载 VocBee，开启轻松愉悦的高效背单词之旅！

使用条款 (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
隐私政策: https://vocbee.online/privacypolicy/""",
        "release_notes": """• 全新上线 Bee Runner 跑酷消除背单词游戏，边玩边记更高效！
• 深度升级 AI 例句与用法解析系统，内容更加生动自然。
• 优化单词卡片滑动流畅度与音频播放稳定性。
• 修复已知问题，全面提升使用体验。"""
    },

    "ar": {
        "name": "VocBee: تعلم كلمات الإنجليزية",
        "subtitle": "مفردات وبطاقات تعليمية يومية",
        "keywords": "لغة,حفظ,قواعد,توفل,ايلتس,محادثة,قاموس,تحدث,تمارين,نطق",
        "description": """عزز مفرداتك وتعلم اللغة الإنجليزية وأكثر من 20 لغة عالمية بسهولة وسرعة مع تطبيق VocBee! سواء كنت تستعد لاختبارات مثل التوفل (TOEFL) أو الآيلتس (IELTS)، أو ترغب في تطوير مهاراتك في المحادثة والدراسة، فإن VocBee هو رفيقك المثالي.

لماذا تختار تطبيق VocBee؟
وداعاً لطرق الحفظ التقليدية المملة. يجمع VocBee بين خوارزميات التكرار المتباعد العلمية، والبطاقات التعليمية التفاعلية، والذكاء الاصطناعي الذكي، ولعبة ركض سريعة وممتعة لتثبيت الكلمات في الذاكرة طويلة المدى.

الميزات الرئيسية:

• لعبة ركض النحلة (Bee Runner) الممتعة
حوّل وقت الدراسة إلى متعة حقيقية! وجّه نحلتك نحو المسار الصحيح لمطابقة الكلمات بمعانيها بأقصى سرعة واختبر قوة تركيزك وحفظك.

• بطاقات تعليمية مقسمة حسب المستويات (A1 إلى C1)
تدرج في حفظ الكلمات من المستوى المبتدئ وحتى المستوى المتقدم عبر سحب البطاقات بسلاسة وسهولة.

• أمثلة وسياقات واقعية عبر الذكاء الاصطناعي
لا تحفظ الكلمات منفردة بعد اليوم! احصل على جمل وأمثلة حية وسياقية تم إنشاؤها بالذكاء الاصطناعي لتتحدث بطلاقة وثقة.

• نطق صوتي نقي وواضح
استمع إلى النطق الصحيح لكل كلمة لتحسين مهارات الاستماع وإتقان اللهجة الصحيحة.

• التكرار المتباعد وحماس التتابع اليومي (Streak)
نظام تكرار ذكي يعيد لك الكلمات في الوقت المناسب قبل أن تنساها تماماً. حافظ على حماسك وتدرب يومياً.

• يدعم أكثر من 20 لغة عالمية
تعلم الإنجليزية، الإسبانية، الفرنسية، الألمانية، الإيطالية، التركية، اليابانية، الكورية، وغيرها الكثير.

ابدأ رحلة إتقان اللغات اليوم مع VocBee!

شروط الاستخدام (EULA): https://vocbee.online/terms/
اتفاقية أبل القياسية EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
سياسة الخصوصية: https://vocbee.online/privacypolicy/""",
        "release_notes": """• ميزة جديدة: إطلاق لعبة Bee Runner لمطابقة الكلمات وحفظها بطريقة مشوقة!
• تحسين دقة الأمثلة وسياقات الجمل التي ينتجها الذكاء الاصطناعي.
• تجربة سحب بطاقات أكثر سلاسة وتحسين جودة الصوت والنطق.
• إصلاحات عامة وتحسينات في سرعة وأداء التطبيق."""
    },

    "hi": {
        "name": "VocBee: English Vocabulary",
        "subtitle": "Learn Words & अंग्रेजी सीखें",
        "keywords": "angrezi,sikhna,shabd,bolna,sikhe,meaning,ielts,toefl,flashcards,words,dictionary,grammar",
        "description": """VocBee के साथ अपनी English Vocabulary और वर्ड पावर को तेजी से बढ़ाएं! चाहे आप IELTS, TOEFL, SSC, या प्रतियोगी परीक्षाओं की तैयारी कर रहे हों, या रोजमर्रा की अंग्रेजी बोलना और समझना चाहते हों, VocBee आपके लिए सबसे आसान और असरदार ऐप है।

VocBee क्यों खास है?
रटने के पुराने तरीकों को कहें अलविदा! VocBee वैज्ञानिक स्पेस्ड रिपीटिशन (Spaced Repetition), स्वाइप फ्लैशकार्ड्स, आधुनिक AI उदाहरण और एक रोमांचक एक्शन गेम के साथ शब्दों को हमेशा के लिए याद रखने में मदद करता है।

मुख्य विशेषताएं:

• बी रनर (Bee Runner) वर्ड गेम
खेल-खेल में शब्द सीखें! अपनी मधुमक्खी को सही लेन में ले जाएं और सही अर्थ वाले शब्दों से मैच करें। तेज गति का यह गेम आपकी याददाश्त को मजबूत बनाता है।

• लेवल के अनुसार फ्लैशकार्ड्स (A1 से C1)
शुरुआती (Beginner) से लेकर एडवांस (Advanced) स्तर तक के हजारों महत्वपूर्ण शब्द। आसान स्वाइप से शब्दों को सीखें।

• AI द्वारा तैयार किए गए वास्तविक उदाहरण वाक्य
शब्दों का सही उपयोग समझें। AI तकनीक से बने प्राकृतिक और दैनिक जीवन के वाक्यों से आपकी स्पोकन इंग्लिश बेहतर होगी।

• स्पष्ट नेटिव ऑडियो उच्चारण
हर शब्द का सही उच्चारण सुनें ताकि आपकी स्पीकिंग और लिसनिंग स्किल्स मजबूत हों।

• स्पेस्ड रिपीटिशन और डेली स्ट्रीक
स्मार्ट रिवीजन सिस्टम जो आपको भूलने से ठीक पहले शब्द याद दिलाता है। अपनी डेली स्ट्रीक बनाए रखें और हर दिन आगे बढ़ें।

• 20 से अधिक भाषाओं का सपोर्ट
अंग्रेजी के साथ-साथ स्पैनिश, फ्रेंच, जर्मन, जापानी, कोरियन, अरबी जैसी 20+ भाषाएं सीखें।

आज ही VocBee डाउनलोड करें और अंग्रेजी में आत्मविश्वास पाएं!

Terms of Use (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• नया Bee Runner गेम: शब्दों को मैच करें और एक्शन के साथ वोकैब्युलरी सीखें!
• बेहतर AI वाक्य उदाहरण और विस्तृत व्याख्याएं।
• कार्ड स्वाइप करने में अधिक स्मूथनेस और ऑडियो क्वालिटी में सुधार।
• बग फिक्स और परफॉरमेंस में सुधार।"""
    },

    "id": {
        "name": "VocBee: Belajar Kosakata",
        "subtitle": "Bahasa Inggris & Kartu Kata",
        "keywords": "hafal,kamus,flashcard,toefl,ielts,latihan,cakap,bicara,pemula,kata,tata,bahasa,mudah",
        "description": """Tingkatkan kosakata bahasa Inggris dan kuasai lebih dari 20 bahasa dengan cepat dan seru bersama VocBee! Sangat cocok untuk persiapan tes TOEFL, IELTS, kebutuhan kerja, maupun percakapan sehari-hari.

MENGAPA MEMILIH VOCBEE?
Lupakan cara menghafal tradisional yang membosankan. VocBee menggabungkan metode Spaced Repetition yang terbukti ilmiah, kartu flashcard interaktif, kecerdasan buatan (AI), dan game arkade seru agar kata-kata melekat kuat di ingatan Anda.

FITUR UNGGULAN:

• Game Edukasi Bee Runner
Belajar sambil bermain! Arahkan lebah Anda ke jalur yang tepat untuk mencocokkan kosakata dengan cepat. Latih refleks dan hafalan kata Anda secara bersamaan.

• Kartu Flashcard Berdasarkan Level (A1 hingga C1)
Dari level pemula hingga tingkat lanjut. Geser kartu ke kanan atau kiri dengan mudah untuk menandai progres belajar Anda.

• Contoh Kalimat Nyata Berbasis AI
Jangan hanya menghafal arti kata. Dapatkan contoh kalimat alami dari AI untuk memahami konteks penggunaan kata dalam kehidupan nyata.

• Audio Pengucapan Asli yang Jelas
Dengarkan pengucapan kata dari penutur asli untuk melatih aksen dan kemampuan mendengar Anda.

• Spaced Repetition & Streak Harian
Algoritma cerdas kami akan mengingatkan kata tepat sebelum Anda melupakannya. Pertahankan streak harian dan bangun kebiasaan belajar yang konsisten!

• Mendukung Lebih dari 20 Bahasa
Pelajari Bahasa Inggris, Spanyol, Prancis, Jerman, Jepang, Korea, Mandarin, Arab, dan banyak lagi.

Unduh VocBee sekarang dan kembangkan kosakata Anda hari ini!

Ketentuan Penggunaan (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Kebijakan Privasi: https://vocbee.online/privacypolicy/""",
        "release_notes": """• BARU: Game arkade Bee Runner untuk menghafal kosakata sambil bermain!
• Peningkatan kualitas contoh kalimat dan penjelasan dari AI.
• Animasi kartu flashcard lebih halus dan audio pengucapan lebih jernih.
• Peningkatan stabilitas dan perbaikan bug."""
    },

    "vi": {
        "name": "VocBee: Học Từ Vựng Tiếng Anh",
        "subtitle": "Flashcard & Luyện Thi TOEIC",
        "keywords": "ielts,ngữ pháp,giao tiếp,học từ,thẻ nhớ,phát âm,bilingual,ôn thi,bài tập",
        "description": """Làm chủ từ vựng tiếng Anh và hơn 20 ngôn ngữ nhanh chóng, dễ nhớ và thú vị cùng VocBee! Ứng dụng lý tưởng để luyện thi TOEIC, IELTS, TOEFL hoặc nâng cao kỹ năng giao tiếp tiếng Anh mỗi ngày.

TẠI SAO NÊN CHỌN VOCBEE?
Không còn phải ghi chép nhồi nhét từ vựng khô khan! VocBee kết hợp phương pháp lặp lại ngắt quãng (Spaced Repetition), flashcard thông minh, trí tuệ nhân tạo (AI) và trò chơi hành động gay cấn giúp bạn ghi nhớ từ vựng sâu vào tiềm thức.

TÍNH NĂNG NỔI BẬT:

• Trò Chơi Nối Từ Bee Runner Kịch Tính
Vừa chơi vừa học! Điều khiển chú ong bay vào đúng làn đường để ghép từ vựng chính xác. Phản xạ nhanh và ghi nhớ từ vựng tức thì.

• Flashcard Theo Chuẩn Khung Châu Âu CEFR (A1 - C1)
Hệ thống từ vựng từ cơ bản cho người mới bắt đầu đến nâng cao học thuật. Thao tác vuốt thẻ mượt mà, tiện lợi.

• Câu Ví Dụ Sinh Động Từ Trí Tuệ Nhân Tạo AI
Hiểu rõ ngữ cảnh sử dụng từ trong đời sống thực tế với các câu ví dụ tự nhiên được tạo bởi AI.

• Phát Âm Bản Xứ Chuẩn Xác
Nghe phát âm chuẩn từng từ giúp bạn cải thiện khả năng nghe và tự tin phát âm chuẩn giọng quốc tế.

• Lặp Lại Ngắt Quãng & Chuỗi Ngày Học (Streak)
Thuật toán thông minh nhắc nhở bạn ôn tập đúng thời điểm trước khi quên. Duy trì chuỗi streak học tập đều đặn mỗi ngày.

• Hỗ Trợ Học Hơn 20 Ngôn Ngữ
Học tiếng Anh, tiếng Tây Ban Nha, tiếng Pháp, tiếng Đức, tiếng Nhật, tiếng Hàn, tiếng Trung, tiếng Nga, v.v.

Tải ngay VocBee hôm nay để bứt phá vốn từ vựng của bạn!

Điều khoản sử dụng (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Chính sách quyền riêng tư: https://vocbee.online/privacypolicy/""",
        "release_notes": """• MỚI: Trò chơi Bee Runner nối từ vựng cực kỳ lôi cuốn!
• Cải tiến câu ví dụ và giải nghĩa thông minh từ AI.
• Trải nghiệm vuốt thẻ mượt hơn cùng chất lượng âm thanh phát âm nâng cao.
• Sửa lỗi và tối ưu hóa hiệu suất tổng thể."""
    },

    "th": {
        "name": "VocBee: เรียนศัพท์ภาษาอังกฤษ",
        "subtitle": "ท่องคำศัพท์ & การ์ดคำศัพท์",
        "keywords": "toeic,ielts,flashcard,จำศัพท์,ฝึกภาษา,สนทนา,สอบ",
        "description": """เก่งคำศัพท์ภาษาอังกฤษและภาษาอื่นๆ กว่า 20 ภาษาได้อย่างรวดเร็วและสนุกสนานกับ VocBee! ตัวช่วยที่ดีที่สุดสำหรับเตรียมสอบ TOEIC, IELTS, TOEFL หรือพัฒนาทักษะการสื่อสารภาษาอังกฤษในชีวิตประจำวันและการทำงาน

ทำไมต้องเลือก VocBee?
บอกลาการท่องจำคำศัพท์แบบเดิมๆ! VocBee ผสานระบบทบทวนตามช่วงเวลา (Spaced Repetition), แฟลชการ์ดใช้งานง่าย, AI อัจฉริยะสร้างตัวอย่างประโยค และมินิเกมสุดเพลิดเพลิน เพื่อให้คุณจำศัพท์ได้อย่างแม่นยำและยาวนาน

จุดเด่นของ VocBee:

• มินิเกมจับคู่คำศัพท์ Bee Runner
เปลี่ยนการท่องศัพท์ให้เป็นเกมแสนสนุก! บังคับผึ้งของคุณบินเข้าเลนที่ถูกต้องเพื่อจับคู่คำศัพท์ ทดสอบทั้งความจำและปฏิกิริยาตอบสนอง

• แฟลชการ์ดตามระดับมาตรฐาน CEFR (A1 ถึง C1)
รวบรวมคำศัพท์ตั้งแต่ระดับเริ่มต้นไปจนถึงระดับสูง ปัดการ์ดซ้ายขวาเพื่อจัดกลุ่มคำศัพท์ได้อย่างสะดวก

• ตัวอย่างประโยคสมจริงสร้างโดย AI
เรียนรู้วิธีการใช้คำศัพท์ในชีวิตจริงด้วยตัวอย่างประโยคที่เป็นธรรมชาติจาก AI

• เสียงออกเสียงสำเนียงเจ้าของภาษา
ฟังเสียงการออกเสียงที่ถูกต้องและชัดเจน เพื่อพัฒนาทักษะการฟังและการพูดของคุณให้มั่นใจ

• ระบบทบทวนอัจฉริยะและสถิติ Streak รายวัน
อัลกอริทึมจะนำคำศัพท์กลับมาให้ทบทวนก่อนที่คุณจะลืม สร้างนิสัยการเรียนรู้ต่อเนื่องทุกวัน

• รองรับมากกว่า 20 ภาษาทั่วโลก
เรียนภาษาอังกฤษ, สเปน, ฝรั่งเศส, เยอรมัน, ญี่ปุ่น, เกาหลี, จีน และอื่นๆ อีกมากมาย

ดาวน์โหลด VocBee วันนี้แล้วเริ่มพัฒนาคลังคำศัพท์ของคุณได้ทันที!

ข้อกำหนดการใช้งาน (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
นโยบายความเป็นส่วนตัว: https://vocbee.online/privacypolicy/""",
        "release_notes": """• ฟีเจอร์ใหม่: มินิเกม Bee Runner บินเก็บและจับคู่คำศัพท์สุดมันส์!
• พัฒนาระบบสร้างประโยคตัวอย่างและคำอธิบายบริบทด้วย AI ให้ละเอียดยิ่งขึ้น
• ปรับปรุงความลื่นไหลในการปัดการ์ดคำศัพท์และคุณภาพเสียงออกเสียง
• แก้ไขข้อผิดพลาดและเพิ่มประสิทธิภาพการทำงานของแอป"""
    },

    "ur": {
        "name": "VocBee: انگریزی الفاظ سیکھیں",
        "subtitle": "Learn English Vocabulary & لغت",
        "keywords": "الفاظ,معانی,مفردات,انگریزی,سیکھیں,ielts,toefl,grammar,words,urdu",
        "description": """VocBee کے ساتھ انگریزی الفاظ کا ذخیرہ اور 20 سے زائد زبانیں آسانی، تیزی اور دلچسپ انداز میں سیکھیں! چاہے آپ IELTS، TOEFL یا امتحانات کی تیاری کر رہے ہوں یا روزمرہ بول چال بہتر بنانا چاہتے ہوں، VocBee آپ کے لیے بہترین ایپ ہے۔

VocBee ہی کیوں؟
روایتی اور بورنگ رٹہ لگانے کو بھول جائیں۔ VocBee سائنسی اسپیسڈ ریپیٹیشن (Spaced Repetition)، فلیش کارڈز، مصنوعی ذہانت (AI) اور تفریحی گیم کے امتزاج سے الفاظ کو آپ کے حافظے میں ہمیشہ کے لیے محفوظ بناتا ہے۔

اہم خصوصیات:

• بی رنر (Bee Runner) دلچسپ لفظی گیم
سیکھنے کو کھیل بنائیے! اپنی مکھی کو صحیح لین میں اڑائیں اور تیزی سے درست لفظ کا انتخاب کریں۔ تفریح کے ساتھ یادداشت کو تیز کریں۔

• لیول کے مطابق فلیش کارڈز (A1 سے C1)
ابتدائی (A1) سے لے کر ایڈوانسڈ (C1) تک منظم انداز میں الفاظ سیکھیں۔ کارڈز کو سوائپ کر کے اپنی پیش رفت نوٹ کریں۔

• جدید AI کے تیار کردہ فطری اور روزمرہ جملے
الفاظ کو تنہا یاد نہ کریں۔ AI کی مدد سے روزمرہ زندگی کے فطری جملوں میں ان کا درست استعمال جانیے۔

• واضح نیٹو آڈیو تلفظ
ہر لفظ کا درست تلفظ سنیں تاکہ آپ کی بول چال اور سننے کی صلاحیت میں نکھار آئے۔

• اسپیسڈ ریپیٹیشن اور روزانہ اسٹریک (Streak)
ہمارا ذہین سسٹم بھولنے سے عین پہلے الفاظ کا اعادہ کرواتا ہے۔ روزانہ پڑھنے کی مسلسل عادت اپنائیں۔

• 20 سے زائد زبانیں سیکھنے کی سہولت
انگریزی کے علاوہ ہسپانوی، فرانسیسی، جرمن، جاپانی، کورین، چینی، عربی اور دیگر زبانیں سیکھیں۔

آج ہی VocBee ڈاؤن لوڈ کریں اور اپنی زبان دانی کو نئی بلندیوں پر لے جائیں!

Terms of Use (EULA): https://vocbee.online/terms/
Apple Standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://vocbee.online/privacypolicy/""",
        "release_notes": """• نئی خصوصیت: پرجوش Bee Runner گیم شامل، الفاظ یاد کرتے ہوئے گیمنگ کا لطف اٹھائیں!
• مصنوعی ذہانت (AI) کے جملوں کی مثالوں اور معانی میں بہتری۔
• فلیش کارڈز کے سوائپ کا عمل مزید ہموار اور آڈیو کوالٹی بہتر بنائی گئی۔
• رفتار میں اضافہ اور بگز کا خاتمہ۔"""
    }
}

def generate_and_validate():
    print(f"Generating optimized metadata for {len(LOCALES_DATA)} locales...")
    errors = []

    for locale, data in LOCALES_DATA.items():
        loc_dir = os.path.join(BASE_DIR, locale)
        os.makedirs(loc_dir, exist_ok=True)

        name = data["name"].strip()
        subtitle = data["subtitle"].strip()
        keywords = data["keywords"].strip()
        description = data["description"].strip()
        release_notes = data["release_notes"].strip()

        # Check limits
        if len(name) > 30:
            errors.append(f"[{locale}] Name is too long: {len(name)} chars > 30 ({ascii(name)})")
        if len(subtitle) > 30:
            errors.append(f"[{locale}] Subtitle is too long: {len(subtitle)} chars > 30 ({ascii(subtitle)})")

        kw_bytes = len(keywords.encode("utf-8"))
        if kw_bytes > 100:
            errors.append(f"[{locale}] Keywords exceed 100 bytes: {kw_bytes} bytes > 100 ({ascii(keywords)})")

        if " ," in keywords or ", " in keywords:
            errors.append(f"[{locale}] Keywords contain spaces adjacent to commas!")

        # Check keyword tokens
        kw_tokens = keywords.split(",")
        for token in kw_tokens:
            token_clean = token.strip().lower()
            if len(token_clean) < 2:
                errors.append(f"[{locale}] Keyword token '{ascii(token)}' is shorter than 2 chars!")

        if len(description) > 4000:
            errors.append(f"[{locale}] Description exceeds 4000 chars: {len(description)}")
        if len(release_notes) > 4000:
            errors.append(f"[{locale}] Release notes exceed 4000 chars: {len(release_notes)}")

        # Write files
        with open(os.path.join(loc_dir, "name.txt"), "w", encoding="utf-8") as f:
            f.write(name + "\n")
        with open(os.path.join(loc_dir, "subtitle.txt"), "w", encoding="utf-8") as f:
            f.write(subtitle + "\n")
        with open(os.path.join(loc_dir, "keywords.txt"), "w", encoding="utf-8") as f:
            f.write(keywords + "\n")
        with open(os.path.join(loc_dir, "description.txt"), "w", encoding="utf-8") as f:
            f.write(description + "\n")
        with open(os.path.join(loc_dir, "release_notes.txt"), "w", encoding="utf-8") as f:
            f.write(release_notes + "\n")

    if errors:
        print(f"\nFAILED with {len(errors)} errors:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: All {len(LOCALES_DATA)} locales generated and 100% compliant with Apple App Store constraints!")

if __name__ == "__main__":
    generate_and_validate()
