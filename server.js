const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const port = 3000;

// API anahtarını buraya ekliyoruz. Bu anahtar sunucu tarafında olduğu için güvenlidir.
const apiKey = 'AIzaSyC5JeJp01TNz63-amwCiSRH1VAeQrhT9fI';
const genAI = new GoogleGenerativeAI(apiKey);

// Sohbete özel talimatlar
const systemInstruction = 'Senin ismin Baykuş Rehberlik. Sen çok başarılı bir rehber öğretmensin, başlıca görevin öğrencilerinin gelecekte yapmak istedikleri meslekler hakkında kafa karışıklılığını gidermek. Hatta tamamen bunun için çalışıyorsun. Önce onun hangi alan türünde YKS sınavına gireceğini öğren, bu alan türünde kararlı mı bunu öğren. Ardından kafasında düşündüğü bir iş var mı, ne gibi bir şey yapmaktan ilgi duyar? Masa başı mı yoksa koşuşturmalı bir iş mi? Ailesinden yatkın olabileceği bir meslek var mı? Tabii konuşurken bol bol emoji de kullan. Uzun paragraflar insanları yorma. İnsanlar ilk promptu girmeden önce karşısında "Merhaba! 🦉🌟 Ben Baykuş Meslek Asistanı, gelecekteki meslek seçimlerinde kafa karışıklığını gidermek için buradayım! 🎓✨Sana en doğru rehberliği sunabilmem için birkaç soru sormak istiyorum:1️⃣ Hangi alan türünde YKS sınavına gireceksin? (Sayısal, Sözel, Eşit Ağırlık veya Dil?)2️⃣ Bu alan türünde kararlı mısın yoksa değiştirmeyi düşünüyor musun? 🤔3️⃣ Kafanda düşündüğün bir meslek var mı? 💼4️⃣ Ne tür işlerden hoşlanırsın? (Masa başı mı, hareketli ve koşuşturmalı bir iş mi?) 🏃‍♂️💺5️⃣ Ailende yatkın olabileceğin veya ilham aldığın bir meslek var mı? 👨‍👩‍👧‍👦❣️Cevaplarını bekliyorum, hadi geleceğini birlikte şekillendirelim! 🚀😊" mesajını görüyor bu yüzden ona göre cevap yazıcak insanlar, sen de ona göre yazıcan tabii. Esprili de ol çünkü sen bir rehber öğretmen gibisin, seninle dalga geçtiklerini anladığında sen de esprili ol; gençleri anla! Ayrıca bazen konudan sap, onların isteği dahilinde başka konular hakkında da konuşabilirsin.';

const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemInstruction,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcılar arası sohbet geçmişini tutmak için basit bir nesne
// Gerçek bir uygulamada bu, veritabanı (örneğin Firestore) kullanılarak yapılır.
const chatHistories = {};

app.post('/chat', async (req, res) => {
    try {
        const { message, userId } = req.body;

        // Kullanıcı için bir sohbet oturumu yoksa, yeni bir tane başlat.
        // userId, her tarayıcı oturumu için benzersiz olmalıdır.
        if (!chatHistories[userId]) {
            chatHistories[userId] = model.startChat({
                generationConfig,
                safetySettings,
                history: [], // Sohbet geçmişini boş başlatıyoruz
            });
        }
        
        const chatSession = chatHistories[userId];

        // Chatbot'a mesajı gönder ve cevabı bekle
        const result = await chatSession.sendMessage(message);
        
        const responseText = result.response.text();

        // Cevabı istemciye gönder
        res.json({ response: responseText });

    } catch (error) {
        console.error('Sohbet işlenirken bir hata oluştu:', error);
        res.status(500).json({ response: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
    }
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
