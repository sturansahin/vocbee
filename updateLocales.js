const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');

const translations = {
  en: {
    step1: "Swipe right to mark words you've learned",
    step2: "Swipe left to review the word again later",
    step3: "Tap the star to save words to your favorites",
    step4: "Tap the word to hear its pronunciation",
    step5: "Tap the speaker to listen to the sentence",
    step6: "Tap here to see more example sentences",
    skip: "Skip",
    next: "Next",
    done: "Got it!",
    stepOf: "{{current}} of {{total}}",
  },
  tr: {
    step1: "Öğrendiğiniz kelimeleri sağa kaydırın",
    step2: "Kelimeyi daha sonra tekrar görmek için sola kaydırın",
    step3: "Kelimeleri favorilerinize eklemek için yıldıza dokunun",
    step4: "Telaffuzunu duymak için kelimenin üzerine dokunun",
    step5: "Cümlenin okunuşunu dinlemek için hoparlör simgesine dokunun",
    step6: "Daha fazla örnek cümle görmek için buraya dokunun",
    skip: "Geç",
    next: "İleri",
    done: "Anladım!",
    stepOf: "{{current}} / {{total}}",
  },
  de: {
    step1: "Nach rechts wischen, um Wörter als gelernt zu markieren",
    step2: "Nach links wischen, um das Wort später noch einmal zu sehen",
    step3: "Tippen Sie auf den Stern, um Wörter als Favoriten zu speichern",
    step4: "Tippen Sie auf das Wort, um die Aussprache zu hören",
    step5: "Tippen Sie auf den Lautsprecher, um den Satz zu hören",
    step6: "Tippen Sie hier, um weitere Beispielsätze zu sehen",
    skip: "Überspringen",
    next: "Weiter",
    done: "Verstanden!",
    stepOf: "{{current}} von {{total}}",
  },
  fr: {
    step1: "Balayez vers la droite pour marquer les mots que vous avez appris",
    step2: "Balayez vers la gauche pour revoir le mot plus tard",
    step3: "Appuyez sur l'étoile pour enregistrer des mots dans vos favoris",
    step4: "Appuyez sur le mot pour entendre sa prononciation",
    step5: "Appuyez sur le haut-parleur pour écouter la phrase",
    step6: "Appuyez ici pour voir d'autres exemples de phrases",
    skip: "Passer",
    next: "Suivant",
    done: "Compris !",
    stepOf: "{{current}} sur {{total}}",
  },
  es: {
    step1: "Desliza a la derecha para marcar las palabras aprendidas",
    step2: "Desliza a la izquierda para repasar la palabra más tarde",
    step3: "Toca la estrella para guardar las palabras en tus favoritos",
    step4: "Toca la palabra para escuchar su pronunciación",
    step5: "Toca el altavoz para escuchar la oración",
    step6: "Toca aquí para ver más oraciones de ejemplo",
    skip: "Saltar",
    next: "Siguiente",
    done: "¡Entendido!",
    stepOf: "{{current}} de {{total}}",
  },
  it: {
    step1: "Scorri verso destra per contrassegnare le parole imparate",
    step2: "Scorri verso sinistra per ripassare la parola in seguito",
    step3: "Tocca la stella per salvare le parole nei preferiti",
    step4: "Tocca la parola per ascoltare la sua pronuncia",
    step5: "Tocca l'altoparlante per ascoltare la frase",
    step6: "Tocca qui per vedere altre frasi di esempio",
    skip: "Salta",
    next: "Avanti",
    done: "Capito!",
    stepOf: "{{current}} di {{total}}",
  },
  pt: {
    step1: "Deslize para a direita para marcar as palavras aprendidas",
    step2: "Deslize para a esquerda para revisar a palavra depois",
    step3: "Toque na estrela para salvar as palavras nos favoritos",
    step4: "Toque na palavra para ouvir a sua pronúncia",
    step5: "Toque no alto-falante para ouvir a frase",
    step6: "Toque aqui para ver mais frases de exemplo",
    skip: "Pular",
    next: "Próximo",
    done: "Entendi!",
    stepOf: "{{current}} de {{total}}",
  },
  ru: {
    step1: "Смахните вправо, чтобы отметить выученные слова",
    step2: "Смахните влево, чтобы повторить слово позже",
    step3: "Нажмите на звездочку, чтобы сохранить слова в избранное",
    step4: "Нажмите на слово, чтобы услышать его произношение",
    step5: "Нажмите на динамик, чтобы прослушать предложение",
    step6: "Нажмите здесь, чтобы увидеть больше примеров",
    skip: "Пропустить",
    next: "Далее",
    done: "Понятно!",
    stepOf: "{{current}} из {{total}}",
  },
  ar: {
    step1: "اسحب لليمين لتحديد الكلمات التي تعلمتها",
    step2: "اسحب لليسار لمراجعة الكلمة لاحقًا",
    step3: "اضغط على النجمة لحفظ الكلمات في المفضلة",
    step4: "اضغط على الكلمة للاستماع إلى نطقها",
    step5: "اضغط على مكبر الصوت للاستماع إلى الجملة",
    step6: "اضغط هنا لرؤية المزيد من الجمل الأمثلة",
    skip: "تخطي",
    next: "التالي",
    done: "فهمت",
    stepOf: "{{current}} من {{total}}",
  },
  zh: {
    step1: "向右滑动以标记已学会的单词",
    step2: "向左滑动以稍后再次复习该单词",
    step3: "点击星号将单词收藏",
    step4: "点击单词听取发音",
    step5: "点击扬声器听取句子",
    step6: "点击此处查看更多例句",
    skip: "跳过",
    next: "下一步",
    done: "知道了！",
    stepOf: "第 {{current}} / {{total}}",
  },
  ja: {
    step1: "右にスワイプして学習済みの単語をマークします",
    step2: "左にスワイプして後で単語を復習します",
    step3: "星をタップして単語をお気に入りに保存します",
    step4: "単語をタップして発音を聞きます",
    step5: "スピーカーをタップして文章を聞きます",
    step6: "ここをタップして他の例文を表示します",
    skip: "スキップ",
    next: "次へ",
    done: "了解！",
    stepOf: "{{current}} / {{total}}",
  },
  ko: {
    step1: "오른쪽으로 스와이프하여 학습한 단어를 표시하세요",
    step2: "왼쪽으로 스와이프하여 나중에 단어를 다시 복습하세요",
    step3: "별을 탭하여 단어를 즐겨찾기에 저장하세요",
    step4: "단어를 탭하여 발음을 들어보세요",
    step5: "스피커를 탭하여 문장을 들어보세요",
    step6: "여기를 탭하여 더 많은 예문을 확인하세요",
    skip: "건너뛰기",
    next: "다음",
    done: "알겠습니다!",
    stepOf: "{{current}} / {{total}}",
  },
  hi: {
    step1: "सीखे गए शब्दों को चिह्नित करने के लिए दाईं ओर स्वाइप करें",
    step2: "शब्द को बाद में फिर से देखने के लिए बाईं ओर स्वाइप करें",
    step3: "शब्दों को अपने पसंदीदा में सहेजने के लिए स्टार पर टैप करें",
    step4: "इसका उच्चारण सुनने के लिए शब्द पर टैप करें",
    step5: "वाक्य सुनने के लिए स्पीकर पर टैप करें",
    step6: "अधिक उदाहरण वाक्य देखने के लिए यहां टैप करें",
    skip: "छोड़ें",
    next: "अगला",
    done: "समझ गया!",
    stepOf: "{{current}} का {{total}}",
  },
  id: {
    step1: "Geser ke kanan untuk menandai kata yang telah dipelajari",
    step2: "Geser ke kiri untuk mengulas kata lagi nanti",
    step3: "Ketuk bintang untuk menyimpan kata ke favorit Anda",
    step4: "Ketuk kata untuk mendengar pengucapannya",
    step5: "Ketuk speaker untuk mendengarkan kalimatnya",
    step6: "Ketuk di sini untuk melihat kalimat contoh lainnya",
    skip: "Lewati",
    next: "Berikutnya",
    done: "Mengerti!",
    stepOf: "{{current}} dari {{total}}",
  },
  vi: {
    step1: "Vuốt sang phải để đánh dấu các từ bạn đã học",
    step2: "Vuốt sang trái để xem lại từ đó sau",
    step3: "Nhấn vào ngôi sao để lưu các từ vào mục yêu thích của bạn",
    step4: "Nhấn vào từ để nghe phát âm",
    step5: "Nhấn vào loa để nghe câu",
    step6: "Nhấn vào đây để xem thêm các câu ví dụ",
    skip: "Bỏ qua",
    next: "Tiếp theo",
    done: "Đã hiểu!",
    stepOf: "{{current}} của {{total}}",
  },
  th: {
    step1: "ปัดไปทางขวาเพื่อทำเครื่องหมายคำศัพท์ที่เรียนรู้แล้ว",
    step2: "ปัดไปทางซ้ายเพื่อทบทวนคำศัพท์อีกครั้งในภายหลัง",
    step3: "แตะที่ดาวเพื่อบันทึกคำศัพท์ลงในรายการโปรด",
    step4: "แตะที่คำศัพท์เพื่อฟังการออกเสียง",
    step5: "แตะที่ลำโพงเพื่อฟังประโยค",
    step6: "แตะที่นี่เพื่อดูประโยคตัวอย่างเพิ่มเติม",
    skip: "ข้าม",
    next: "ถัดไป",
    done: "เข้าใจแล้ว!",
    stepOf: "{{current}} จาก {{total}}",
  },
  am: {
    step1: "የተማሩትን ቃላት ላይ ምልክት ለማድረግ ወደ ቀኝ ያንሸራትቱ",
    step2: "ቃሉን ቆየት ብለው ለመከለስ ወደ ግራ ያንሸራትቱ",
    step3: "ቃላትን ለተመራጮችዎ ለማቆየት ኮከቡን ይንኩ",
    step4: "አጠራሩን ለመስማት ቃሉን ይንኩ",
    step5: "ዓረፍተ ነገሩን ለመስማት ስፒከሩን ይንኩ",
    step6: "ተጨማሪ ምሳሌ ዓረፍተ ነገሮችን ለማየት እዚህ ይንኩ",
    skip: "ዝለል",
    next: "ቀጣይ",
    done: "ገብቶኛል!",
    stepOf: "ከ {{current}} ውስጥ {{total}}",
  },
  fa: {
    step1: "برای علامت‌گذاری کلماتی که یاد گرفته‌اید به راست بکشید",
    step2: "برای مرور کلمه در زمان دیگر به چپ بکشید",
    step3: "برای ذخیره کلمات در علاقه‌مندی‌ها روی ستاره ضربه بزنید",
    step4: "برای گوش دادن به تلفظ روی کلمه ضربه بزنید",
    step5: "برای گوش دادن به جمله روی بلندگو ضربه بزنید",
    step6: "برای دیدن جملات نمونه بیشتر اینجا ضربه بزنید",
    skip: "رد کردن",
    next: "بعدی",
    done: "متوجه شدم!",
    stepOf: "{{current}} از {{total}}",
  },
  sr: {
    step1: "Превуците удесно да бисте означили научене речи",
    step2: "Превуците улево да бисте касније поново прегледали реч",
    step3: "Додирните звездицу да бисте сачували речи у омиљене",
    step4: "Додирните реч да бисте чули њен изговор",
    step5: "Додирните звучник да бисте чули реченицу",
    step6: "Додирните овде да бисте видели још примера реченица",
    skip: "Прескочи",
    next: "Следеће",
    done: "Разумем!",
    stepOf: "{{current}} од {{total}}",
  },
  sw: {
    step1: "Telezesha kulia kuweka alama kwenye maneno uliyojifunza",
    step2: "Telezesha kushoto kupitia neno tena baadaye",
    step3: "Gusa nyota ili kuhifadhi maneno kwa vipendwa vyako",
    step4: "Gusa neno kusikia matamshi yake",
    step5: "Gusa spika ili usikilize sentensi",
    step6: "Gusa hapa kuona sentensi zaidi za mfano",
    skip: "Ruka",
    next: "Ifuatayo",
    done: "Nimeelewa!",
    stepOf: "{{current}} ya {{total}}",
  },
  ur: {
    step1: "سیکھے ہوئے الفاظ کو نشان زد کرنے کے لیے دائیں سوائپ کریں",
    step2: "بعد میں لفظ کا جائزہ لینے کے لیے بائیں سوائپ کریں",
    step3: "الفاظ کو اپنے پسندیدہ میں محفوظ کرنے کے لیے ستارے کو تھپتھپائیں",
    step4: "اس کا تلفظ سننے کے لیے لفظ کو تھپتھپائیں",
    step5: "جملہ سننے کے لیے اسپیکر کو تھپتھپائیں",
    step6: "مزید مثال کے جملے دیکھنے کے لیے یہاں تھپتھپائیں",
    skip: "چھوڑیں",
    next: "اگلا",
    done: "سمجھ گیا!",
    stepOf: "{{current}} کا {{total}}",
  }
};

const defaultTranslations = translations.en;

function updateLocales() {
  fs.readdirSync(localesDir).forEach(file => {
    if (file.endsWith('.ts')) {
      const lang = file.replace('.ts', '');
      const filePath = path.join(localesDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if it already has homeTutorial
      if (content.includes('homeTutorial:')) {
        console.log(`Skipping ${lang}, homeTutorial already exists.`);
        return;
      }

      const trans = translations[lang] || defaultTranslations;
      const transString = `
    homeTutorial: {
        step1: "${trans.step1.replace(/"/g, '\\"')}",
        step2: "${trans.step2.replace(/"/g, '\\"')}",
        step3: "${trans.step3.replace(/"/g, '\\"')}",
        step4: "${trans.step4.replace(/"/g, '\\"')}",
        step5: "${trans.step5.replace(/"/g, '\\"')}",
        step6: "${trans.step6.replace(/"/g, '\\"')}",
        skip: "${trans.skip.replace(/"/g, '\\"')}",
        next: "${trans.next.replace(/"/g, '\\"')}",
        done: "${trans.done.replace(/"/g, '\\"')}",
        stepOf: "${trans.stepOf.replace(/"/g, '\\"')}",
    },`;

      // Find the last closing brace of the export default object
      // We will look for "\n};" at the end of the file
      const regex = /\n\s*};\s*$/;
      if (regex.test(content)) {
        content = content.replace(regex, `,${transString}\n};`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${lang}`);
      } else {
        console.log(`Could not update ${lang} - format unexpected.`);
      }
    }
  });
}

updateLocales();
