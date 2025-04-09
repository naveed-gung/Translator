const themeToggleBtn = document.getElementById('theme-toggle');
const html = document.documentElement;
const themeColorMeta = document.getElementById('theme-color');
const translateBtn = document.getElementById('translateBtn');
const clearBtn = document.getElementById('clearBtn');
const sourceTextarea = document.getElementById('sourceText');
const translatedTextDiv = document.querySelector('.target-text-container');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const textToSpeechBtn = document.getElementById('textToSpeechBtn');
const sourceTextToSpeechBtn = document.getElementById('sourceTextToSpeechBtn');
const sourceLanguageSelect = document.querySelector('main section:first-child select');
const targetLanguageSelect = document.querySelector('main section:nth-child(2) select');
const copyBtn = document.getElementById('copyBtn');
const historyBtn = document.getElementById('historyBtn');
const historyDropdown = document.getElementById('historyDropdown');
const historyList = document.getElementById('historyList');
const detectLanguageBtn = document.getElementById('detectLanguageBtn');
const swapLanguagesBtn = document.getElementById('swapLanguagesBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const fileUploadBtn = document.getElementById('fileUploadBtn');
const fileInput = document.getElementById('fileInput');

const API_BASE_URL = 'https://api.mymemory.translated.net/get?q=';

let translationHistory = [];
let translationTimeout = null;
const TYPING_DELAY = 1000; 

const initializeFromLocalStorage = () => {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
        translationHistory = JSON.parse(savedHistory);
        updateHistoryDropdown();
    }
};

let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true; 
    recognition.interimResults = true; 
    recognition.maxAlternatives = 3; 
}

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
    if (theme === 'dark') {
        html.classList.add('dark');
        themeColorMeta.setAttribute('content', '#111827');
    } else {
        html.classList.remove('dark');
        themeColorMeta.setAttribute('content', '#f9fafb'); 
    }
    localStorage.setItem('theme', theme);
};

applyTheme(getInitialTheme());

themeToggleBtn.addEventListener('click', () => {
    const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    
    themeToggleBtn.classList.add('animate-wiggle');
    
    setTimeout(() => {
        themeToggleBtn.classList.remove('animate-wiggle');
    }, 1000);
});

if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        const translatedText = translatedTextDiv.textContent.trim();
        
        if (!translatedText || translatedText === 'Translation will appear here...' || translatedText === 'Please enter some text to translate') {
            return;
        }
        
        const textarea = document.createElement('textarea');
        textarea.value = translatedText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const originalTooltip = copyBtn.getAttribute('data-tooltip');
        copyBtn.setAttribute('data-tooltip', 'Copied!');
        copyBtn.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-700', 'dark:text-green-300');
        
        setTimeout(() => {
            copyBtn.setAttribute('data-tooltip', originalTooltip);
            copyBtn.classList.remove('bg-green-100', 'dark:bg-green-900', 'text-green-700', 'dark:text-green-300');
        }, 2000);
    });
}

const updateHistoryDropdown = () => {
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (translationHistory.length === 0) {
        historyList.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-2">No translations yet</p>';
        return;
    }
    
    translationHistory.slice().reverse().forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('p-2', 'hover:bg-gray-100', 'dark:hover:bg-gray-700', 'rounded', 'cursor-pointer', 'transition-colors', 'duration-200');
        
        const sourceText = item.sourceText.length > 30 ? item.sourceText.substring(0, 30) + '...' : item.sourceText;
        const targetText = item.translatedText.length > 30 ? item.translatedText.substring(0, 30) + '...' : item.translatedText;
        
        historyItem.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">${item.fromLang} → ${item.toLang}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div class="text-sm font-semibold">${sourceText}</div>
            <div class="text-sm text-primary-600 dark:text-primary-400">${targetText}</div>
        `;
        
        historyItem.addEventListener('click', () => {
            sourceLanguageSelect.value = item.fromLang;
            targetLanguageSelect.value = item.toLang;
            
            sourceTextarea.value = item.sourceText;
            
            translatedTextDiv.innerHTML = `
                <p class="text-gray-800 dark:text-gray-200">
                    ${item.translatedText}
                </p>
            `;
            
            toggleHistoryDropdown(false);
        });
        
        historyList.appendChild(historyItem);
    });
};

const toggleHistoryDropdown = (show) => {
    if (!historyDropdown) return;
    
    if (show === undefined) {
        show = historyDropdown.classList.contains('hidden');
    }
    
    if (show) {
        historyDropdown.classList.remove('hidden', 'scale-95', 'opacity-0');
        historyDropdown.classList.add('scale-100', 'opacity-100');
    } else {
        historyDropdown.classList.add('hidden', 'scale-95', 'opacity-0');
        historyDropdown.classList.remove('scale-100', 'opacity-100');
    }
};

if (historyBtn && historyDropdown) {
    historyBtn.addEventListener('click', () => {
        toggleHistoryDropdown();
    });
    
    document.addEventListener('click', (event) => {
        if (!historyBtn.contains(event.target) && !historyDropdown.contains(event.target)) {
            toggleHistoryDropdown(false);
        }
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        translationHistory = [];
        localStorage.removeItem('translationHistory');
        updateHistoryDropdown();
        
        clearHistoryBtn.classList.add('bg-red-200', 'dark:bg-red-800');
        setTimeout(() => {
            clearHistoryBtn.classList.remove('bg-red-200', 'dark:bg-red-800');
        }, 500);
    });
}

const saveToHistory = (sourceText, translatedText, fromLang, toLang) => {
    const historyItem = {
        sourceText,
        translatedText,
        fromLang,
        toLang,
        timestamp: Date.now()
    };
    
    translationHistory.push(historyItem);
    if (translationHistory.length > 10) {
        translationHistory.shift();
    }
    
    localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
    
    updateHistoryDropdown();
};

if (fileUploadBtn && fileInput) {
    fileUploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Please select a file under 5MB for optimal performance.");
            fileInput.value = '';
            return;
        }
        
        fileUploadBtn.classList.add('animate-pulse');
        translatedTextDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Extracting text from file...</p>';
        
        try {
            let extractedText = '';
            const fileType = file.type || '';
            const fileName = file.name || '';
            
            if (fileType.includes('image/')) {
                extractedText = await extractTextFromImage(file);
            } else if (fileType.includes('text/') || fileName.endsWith('.txt')) {
                extractedText = await extractTextFromTextFile(file);
            } else if (fileType.includes('application/pdf') || fileName.endsWith('.pdf') ||
                      fileType.includes('application/msword') || 
                      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                      fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                extractedText = await extractTextFromDocument(file);
            } else {
                throw new Error('Unsupported file type');
            }
            
            sourceTextarea.value = extractedText;
            
            translatedTextDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Translation will appear here...</p>';
            
            if (extractedText && 
                !extractedText.includes("unavailable") && 
                !extractedText.includes("No text detected") && 
                detectLanguageBtn) {
                detectLanguageBtn.click();
            }
        } catch (error) {
            console.error('Error extracting text from file:', error);
            sourceTextarea.value = `Error extracting text: ${error.message}. Please try a different file or enter text manually.`;
            translatedTextDiv.innerHTML = '<p class="text-red-500 dark:text-red-400">File text extraction failed. Try a different file format or enter text manually.</p>';
        } finally {
            fileUploadBtn.classList.remove('animate-pulse');
            fileInput.value = '';
        }
    });
}

const extractTextFromImage = async (file) => {
    try {
        const base64Image = await fileToBase64(file);
        
        const apiKey = 'K81598237288957'; 
        
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'base64Image': `data:image/png;base64,${base64Image}`,
                'language': 'eng', 
                'OCREngine': '2', 
                'scale': 'true',
                'isTable': 'false',
                'detectOrientation': 'true'
            })
        });
        
        const data = await response.json();
        
        if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage || 'OCR processing failed');
        }
        
        if (data.ParsedResults && data.ParsedResults.length > 0) {
            const extractedText = data.ParsedResults[0].ParsedText.trim();
            return extractedText || "No text detected in the image. Try with a clearer image.";
        } else {
            return "No text detected in the image. Try with a clearer image.";
        }
    } catch (error) {
        console.error('OCR API error:', error);
        throw error;
    }
};

const extractTextFromTextFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(e) {
            reject(new Error('Failed to read text file'));
        };
        reader.readAsText(file);
    });
};

const extractTextFromDocument = async (file) => {
    try {
        const base64Data = await fileToBase64(file);
        const fileType = file.type || '';
        const fileName = file.name || '';
        let documentType = 'document';
        
        if (fileType.includes('application/pdf') || fileName.endsWith('.pdf')) {
            documentType = 'PDF';
        } else if (fileType.includes('application/msword') || 
                  fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                  fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
            documentType = 'Word document';
        }
        
        const apiKey = 'K81598237288957'; 
        
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'base64Image': `data:application/octet-stream;base64,${base64Data}`,
                'language': 'eng',
                'OCREngine': '2',
                'scale': 'true',
                'isTable': 'false',
                'detectOrientation': 'true'
            })
        });
        
        const data = await response.json();
        
        if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage || `${documentType} processing failed`);
        }
        
        if (data.ParsedResults && data.ParsedResults.length > 0) {
            const extractedText = data.ParsedResults[0].ParsedText.trim();
            return extractedText || `No text detected in the ${documentType.toLowerCase()}. Try with a different file.`;
        } else {
            return `No text detected in the ${documentType.toLowerCase()}. Try with a different file.`;
        }
    } catch (error) {
        console.error('Document extraction error:', error);
        throw new Error(`Failed to extract text from document: ${error.message}`);
    }
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
};

const detectLanguage = async (text) => {
    try {
        const response = await fetch('https://libretranslate.com/detect', {
            method: 'POST',
            body: JSON.stringify({
                q: text.substring(0, 500) 
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0 && data[0].language) {
            return mapToSupportedLanguage(data[0].language);
        } else {
            return detectLanguageFallback(text);
        }
    } catch (error) {
        console.error('Language detection API error:', error);
        return detectLanguageFallback(text);
    }
};

const detectLanguageFallback = async (text) => {
    try {
        const apiKey = 'c33c1cfd0d66d2f0ad97d4f35c92e914'; 
        
        const response = await fetch('https://ws.detectlanguage.com/0.2/detect', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: text.substring(0, 500)
            })
        });
        
        const data = await response.json();
        
        if (data && data.data && data.data.detections && data.data.detections.length > 0) {
            const detections = data.data.detections.sort((a, b) => b.confidence - a.confidence);
            return mapToSupportedLanguage(detections[0].language);
        } else {
            return basicLanguageDetection(text);
        }
    } catch (error) {
        console.error('Fallback language detection API error:', error);
        return basicLanguageDetection(text);
    }
};

const mapToSupportedLanguage = (detectedCode) => {
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar'];
    
    if (supportedLanguages.includes(detectedCode)) {
        return detectedCode;
    }
    
    return 'en';
};

const basicLanguageDetection = (text) => {
    if (/[\u0600-\u06FF]/.test(text)) {
        return 'ar';
    } else if (/[\u00C0-\u017F]/.test(text)) {
        return 'fr'; 
    } else if (/[áéíóúüñ]/i.test(text)) {
        return 'es'; 
    } else if (/[äöüß]/i.test(text)) {
        return 'de'; 
    } else if (/[àèéìòù]/i.test(text)) {
        return 'it'; 
    } else if (/[ãõçâêô]/i.test(text)) {
        return 'pt'; 
    } else {
        return 'en'; 
    }
};

if (detectLanguageBtn) {
    detectLanguageBtn.addEventListener('click', async () => {
        const sourceText = sourceTextarea.value.trim();
        
        if (!sourceText) {
            return;
        }
        
        detectLanguageBtn.classList.add('animate-spin');
        
        try {
            const detectedLang = await detectLanguage(sourceText);
            
            sourceLanguageSelect.value = detectedLang;
            
            detectLanguageBtn.classList.remove('animate-spin');
            detectLanguageBtn.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-700', 'dark:text-green-300');
            
            setTimeout(() => {
                detectLanguageBtn.classList.remove('bg-green-100', 'dark:bg-green-900', 'text-green-700', 'dark:text-green-300');
            }, 2000);
        } catch (error) {
            console.error('Language detection error:', error);
            detectLanguageBtn.classList.remove('animate-spin');
        }
    });
}

if (swapLanguagesBtn) {
    swapLanguagesBtn.addEventListener('click', () => {
        const sourceLang = sourceLanguageSelect.value;
        const targetLang = targetLanguageSelect.value;
        const sourceText = sourceTextarea.value.trim();
        const translatedText = translatedTextDiv.textContent.trim();
        
        sourceLanguageSelect.value = targetLang;
        targetLanguageSelect.value = sourceLang;
        
        if (translatedText && translatedText !== 'Translation will appear here...' && translatedText !== 'Please enter some text to translate') {
            sourceTextarea.value = translatedText;
            translatedTextDiv.innerHTML = `
                <p class="text-gray-800 dark:text-gray-200">
                    ${sourceText}
                </p>
            `;
        }
        
        swapLanguagesBtn.classList.add('animate-spin');
        
        swapLanguagesBtn.classList.add('transform-active');
        swapLanguagesBtn.style.transform = 'translateY(-3px) scale(1.05)';
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        swapLanguagesBtn.style.boxShadow = isDarkMode 
            ? '0 4px 12px rgba(255, 255, 255, 0.1)' 
            : '0 4px 12px rgba(0, 0, 0, 0.15)';
        
        setTimeout(() => {
            swapLanguagesBtn.classList.remove('animate-spin');
            swapLanguagesBtn.classList.remove('transform-active');
            swapLanguagesBtn.style.transform = '';
            swapLanguagesBtn.style.boxShadow = '';
        }, 500);
    });
}

if (voiceInputBtn && recognition) {
    let isRecording = false;
    
    voiceInputBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
            voiceInputBtn.classList.remove('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300', 'animate-pulse');
            voiceInputBtn.classList.add('bg-primary-100', 'dark:bg-primary-900', 'text-primary-700', 'dark:text-primary-300');
        } else {
            if (sourceTextarea.value.trim() !== "" && confirm("Clear existing text and start new voice input?")) {
                sourceTextarea.value = "";
            }
            
            recognition.lang = sourceLanguageSelect.value;
            recognition.start();
            sourceTextarea.placeholder = "Listening...";
            
            voiceInputBtn.classList.remove('bg-primary-100', 'dark:bg-primary-900', 'text-primary-700', 'dark:text-primary-300');
            voiceInputBtn.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300', 'animate-pulse');
        }
        
        isRecording = !isRecording;
    });
    
    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            if (sourceTextarea.value) {
                sourceTextarea.value += ' ' + finalTranscript;
            } else {
                sourceTextarea.value = finalTranscript;
            }
        }
        
        if (interimTranscript) {
            sourceTextarea.placeholder = "Listening: " + interimTranscript;
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        sourceTextarea.placeholder = "Voice input failed. Try again.";
        isRecording = false;
        voiceInputBtn.classList.remove('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300', 'animate-pulse');
        voiceInputBtn.classList.add('bg-primary-100', 'dark:bg-primary-900', 'text-primary-700', 'dark:text-primary-300');
    };
    
    recognition.onend = () => {
        isRecording = false;
        voiceInputBtn.classList.remove('bg-red-100', 'dark:bg-red-900', 'text-red-700', 'dark:text-red-300', 'animate-pulse');
        voiceInputBtn.classList.add('bg-primary-100', 'dark:bg-primary-900', 'text-primary-700', 'dark:text-primary-300');
        sourceTextarea.placeholder = "Enter text to translate...";
        
        if (sourceTextarea.value.trim() && detectLanguageBtn) {
            detectLanguageBtn.click();
            
            if (confirm("Do you want to translate the spoken text now?")) {
                sourceTextarea.dispatchEvent(new Event('input'));
            }
        }
    };
} else if (voiceInputBtn) {
    voiceInputBtn.classList.add('opacity-50', 'cursor-not-allowed');
    voiceInputBtn.setAttribute('data-tooltip', 'Speech recognition not supported in this browser');
}

if (sourceTextToSpeechBtn) {
    sourceTextToSpeechBtn.addEventListener('click', () => {
        const sourceText = sourceTextarea.value.trim();
        
        if (!sourceText) {
            return;
        }
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(sourceText);
        
        utterance.lang = sourceLanguageSelect.value;
        
        utterance.rate = 1.0;  
        utterance.pitch = 1.0; 
        utterance.volume = 1.0; 
        
        const voices = window.speechSynthesis.getVoices();
        const languageVoices = voices.filter(voice => voice.lang.includes(utterance.lang));
        if (languageVoices.length > 0) {
            const femaleVoice = languageVoices.find(voice => voice.name.includes('female'));
            utterance.voice = femaleVoice || languageVoices[0];
        }
        
        window.speechSynthesis.speak(utterance);
        
        sourceTextToSpeechBtn.classList.add('animate-pulse');
        
        utterance.onend = () => {
            sourceTextToSpeechBtn.classList.remove('animate-pulse');
        };
        
        utterance.onerror = () => {
            sourceTextToSpeechBtn.classList.remove('animate-pulse');
            console.error('Text to speech error');
        };
    });
}

if (textToSpeechBtn) {
    textToSpeechBtn.addEventListener('click', () => {
        const translatedText = translatedTextDiv.textContent.trim();
        
        if (!translatedText || translatedText === 'Translation will appear here...' || translatedText === 'Please enter some text to translate') {
            return;
        }
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(translatedText);
        
        utterance.lang = targetLanguageSelect.value;
        
        utterance.rate = 1.0;  
        utterance.pitch = 1.0; 
        utterance.volume = 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        const languageVoices = voices.filter(voice => voice.lang.includes(utterance.lang));
        if (languageVoices.length > 0) {
            const femaleVoice = languageVoices.find(voice => voice.name.includes('female'));
            utterance.voice = femaleVoice || languageVoices[0];
        }
        
        window.speechSynthesis.speak(utterance);
        
        textToSpeechBtn.classList.add('animate-pulse');
        
        utterance.onend = () => {
            textToSpeechBtn.classList.remove('animate-pulse');
        };
        
        utterance.onerror = () => {
            textToSpeechBtn.classList.remove('animate-pulse');
            console.error('Text to speech error');
        };
    });
    
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('main section, .feature-card');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${0.1 * (index + 1)}s`;
    });
    
    initializeFromLocalStorage();
});

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        clearBtn.classList.add('animate-wiggle');
        setTimeout(() => clearBtn.classList.remove('animate-wiggle'), 500);
        
        const sourceTextarea = document.getElementById('sourceText');
        const translatedTextDiv = document.querySelector('.target-text-container');

        sourceTextarea.style.opacity = '0';
        setTimeout(() => {
            sourceTextarea.value = '';
            sourceTextarea.style.opacity = '1';
        }, 300);
    });
}

const translateText = async (text, fromLang, toLang) => {
    try {
        const url = `${API_BASE_URL}${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}&de=example@gmail.com`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        } else if (data && data.responseStatus !== 200) {
            throw new Error(`Translation API error: ${data.responseDetails || 'Unknown error'}`);
        } else {
            throw new Error('Failed to get translation from API');
        }
    } catch (error) {
        console.error('Translation error:', error);
        return `Translation service error: ${error.message}. Please try again later.`;
    }
};

const translateIcon = document.getElementById('translateIcon');

sourceTextarea.addEventListener('input', () => {
    if (translationTimeout) {
        clearTimeout(translationTimeout);
    }
    
    translationTimeout = setTimeout(async () => {
        const sourceText = sourceTextarea.value.trim();
        
        if (!sourceText) {
            translatedTextDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Translation will appear here...</p>';
            return;
        }
        
        const fromLang = sourceLanguageSelect.value;
        const toLang = targetLanguageSelect.value;
        
        translateIcon.classList.remove('hidden');
        translatedTextDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic loading">Translating</p>';
        
        try {
            const translatedText = await translateText(sourceText, fromLang, toLang);
            
            translatedTextDiv.innerHTML = `
                <p class="text-gray-800 dark:text-gray-200">
                    ${translatedText}
                </p>
            `;
            
            if (!translatedText.includes("Translation service error")) {
                saveToHistory(sourceText, translatedText, fromLang, toLang);
            }
        } catch (error) {
            console.error('Translation failed:', error);
            translatedTextDiv.innerHTML = `<p class="text-red-500 dark:text-red-400">Translation failed: ${error.message}</p>`;
        } finally {
            translateIcon.classList.add('hidden');
        }
    }, TYPING_DELAY);
});