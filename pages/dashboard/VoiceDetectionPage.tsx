import React, { useState } from 'react';
import { analyzeCallForFraud } from '../../services/geminiService';
import { CallFraudAnalysisResult, Page } from '../../types';
import DashboardCard from '../../components/DashboardCard';
import { ICONS } from '../../constants';

const CallFraudDetectionPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CallFraudAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
             if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError("File is too large. Please select an audio file under 10MB.");
                return;
            }
            setAudioFile(file);
            setResult(null);
            setError(null);
        }
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    }

    const handleDetect = async () => {
        if (!audioFile) return;
        setIsLoading(true);
        setResult(null);
        setError(null);

        try {
            const base64Audio = await fileToBase64(audioFile);
            const analysisResult = await analyzeCallForFraud(base64Audio, audioFile.type);
            setResult(analysisResult);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze the audio. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const ResultDisplay = ({ result }: { result: CallFraudAnalysisResult }) => {
        const isFraud = result.fraudAssessment === 'Fraudulent Call';
        return (
            <div className="space-y-6">
                <div className={`p-6 rounded-lg text-center ${isFraud ? 'bg-red-100/50 dark:bg-red-900/30 border border-red-300 dark:border-red-700' : 'bg-green-100/50 dark:bg-green-900/30 border border-green-300 dark:border-green-700'}`}>
                    <h3 className={`text-2xl font-bold ${isFraud ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {result.fraudAssessment}
                    </h3>
                    <p className="font-semibold mt-1">Accuracy: {result.confidence}%</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-bold mb-2">Voice Analysis</h4>
                        <p>{result.classification}</p>
                    </div>
                     <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-bold mb-2">Suspicious Keywords Found</h4>
                        {result.keywordsFound.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {result.keywordsFound.map(word => <span key={word} className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-full">{word}</span>)}
                            </div>
                        ) : <p>None</p>}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-2">Explanation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">{result.explanation}</p>
                </div>
                
                {isFraud && (
                    <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 rounded-lg border border-red-300 dark:border-red-700 text-center">
                        <p className="font-semibold text-red-800 dark:text-red-200">If you suspect fraud, report it immediately:</p>
                        <p className="mt-2 text-red-800 dark:text-red-200">Cybercrime Helpline: <strong className="text-xl">1930</strong></p>
                        <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block bg-black text-white dark:bg-white dark:text-black font-bold py-2 px-4 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 text-sm transition-colors">
                            Report on Portal
                        </a>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div>
            <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-black dark:text-white underline hover:opacity-80 mb-4">
                &larr; Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-2 text-center text-black dark:text-white">Call Fraud Detection</h1>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Upload a recorded call (.mp3, .wav) to detect AI-generated voices and scan for keywords commonly used in scams.
            </p>

            <div className="max-w-2xl mx-auto">
                <DashboardCard title="Audio Uploader" icon={ICONS.voice}>
                    <div className="flex flex-col items-center space-y-4">
                         <input
                            type="file"
                            id="audio-upload"
                            accept="audio/mpeg, audio/wav"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label htmlFor="audio-upload" className="w-full text-center cursor-pointer bg-gray-100 dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white transition">
                             {audioFile ? (
                                <div className="text-center">
                                    <p className="font-semibold">Selected file:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{audioFile.name}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-semibold">Click to upload an audio file</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MP3, WAV up to 10MB</p>
                                </div>
                            )}
                        </label>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <button
                            onClick={handleDetect}
                            disabled={!audioFile || isLoading}
                            className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Analyzing Call...
                                </>
                            ) : (
                                "Analyze for Fraud"
                            )}
                        </button>
                    </div>
                </DashboardCard>
                
                {result && (
                    <div className="mt-8 animate-fade-in-up">
                        <DashboardCard title="Analysis Result" icon={ICONS.insights}>
                           <ResultDisplay result={result} />
                        </DashboardCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallFraudDetectionPage;