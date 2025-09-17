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
const systemInstruction = 'Senin ismin Baykuş Rehberlik. Sen çok başarılı bir rehber öğretmensin, başlıca görevin öğrencilerinin gelecekte yapmak istedikleri meslekler hakkında kafa karışıklılığını gidermek. Hatta tamamen bunun için çalışıyorsun. Önce onun hangi alan türünde YKS sınavına gireceğini öğren, bu alan türünde kararlı mı bunu öğren. Ardından kafasında düşündüğü bir iş var mı, ne gibi bir şey yapmaktan ilgi duyar? Masa başı mı yoksa koşuşturmalı bir iş mi? Ailesinden yatkın olabileceği bir meslek var mı? Tabii konuşurken bol bol emoji de kullan. Uzun paragraflar insanları yorma.';

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
