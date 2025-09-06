'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageSquare, Globe, ExternalLink, Play, Pause } from 'lucide-react';

interface LessonData {
  id: string;
  url: string;
  title: string;
  content: string;
  audioUrl?: string;
  translatedContent?: string;
  displayDate: string;
  timestamp: string;
}

interface ConversationResponse {
  lesson: LessonData;
  date: string;
  timestamp: string;
}

export default function ConversationSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 오늘의 영어공부 데이터 가져오기
  const fetchConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/conversation?date=${today}`);
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const data: ConversationResponse = await response.json();
      setLesson(data.lesson);
      
    } catch (error) {
      console.error('영어공부 가져오기 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 영어 내용 표시용 함수 (a 태그 속성만 제거하고 텍스트는 유지)
  const removeOnlyLinks = (html: string): string => {
    console.log('텍스트 제거 시작:', html.substring(0, 200)); // 디버깅용
    
    // "Listen to the Entire Lesson" 텍스트만 제거
    let processed = html.replace(/Listen to the Entire Lesson/gi, '');
    console.log('Listen to the Entire Lesson 제거 후:', processed.substring(0, 200)); // 디버깅용
    
    // <a> 태그의 속성과 태그만 제거하고 텍스트는 유지
    processed = processed.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
    console.log('A 태그 속성 제거 후:', processed.substring(0, 200)); // 디버깅용
    
    // 빈 span 태그 제거
    processed = processed.replace(/<span[^>]*>\s*<\/span>/gi, '');
    console.log('빈 span 제거 후:', processed.substring(0, 200)); // 디버깅용
    
    return processed;
  };

  // 번역용 함수 (모든 HTML 태그 제거)
  const removeHtmlTags = (html: string): string => {
    console.log('HTML 태그 제거 시작:', html.substring(0, 200)); // 디버깅용
    
    // 모든 <a> 태그를 완전히 제거 (링크 텍스트도 제거)
    let processed = html.replace(/<a[^>]*>.*?<\/a>/gi, '');
    console.log('A 태그 완전 제거 후:', processed.substring(0, 200)); // 디버깅용
    
    // 나머지 모든 HTML 태그를 제거하고 텍스트만 추출
    processed = processed.replace(/<[^>]*>/g, '');
    console.log('HTML 태그 제거 후:', processed.substring(0, 200)); // 디버깅용
    
    // HTML 엔티티 디코딩
    processed = processed
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    console.log('HTML 엔티티 디코딩 후:', processed.substring(0, 200)); // 디버깅용
    
    // 연속된 공백과 줄바꿈 정리
    processed = processed.replace(/\s+/g, ' ');
    console.log('공백 정리 후:', processed.substring(0, 200)); // 디버깅용
    
    const result = processed.trim();
    console.log('최종 결과:', result.substring(0, 200)); // 디버깅용
    
    return result;
  };

  // 번역하기
  const handleTranslate = async () => {
    console.log('번역 시작 - lesson.content 존재:', !!lesson?.content); // 디버깅용
    if (!lesson?.content) {
      console.log('lesson.content가 없습니다.'); // 디버깅용
      return;
    }
    
    try {
      setTranslating(true);
      console.log('번역 상태 설정 완료'); // 디버깅용
      
      // HTML 태그를 제거하고 순수 텍스트만 추출
      const cleanText = removeHtmlTags(lesson.content);
      
      console.log('원본 내용 길이:', lesson.content.length); // 디버깅용
      console.log('정리된 텍스트 길이:', cleanText.length); // 디버깅용
      console.log('정리된 텍스트 (처음 200자):', cleanText.substring(0, 200)); // 디버깅용
      console.log('정리된 텍스트 (전체):', cleanText); // 디버깅용
      
      // 한 번에 번역 (Google Translate API가 내부적으로 처리)
      console.log('번역 시도:', cleanText.length, '자');
      
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });
      
      if (!response.ok) {
        throw new Error(`번역 API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('번역 API 응답:', data);
      const translatedContent = data.translated;
      
      console.log('번역 결과 길이:', translatedContent.length); // 디버깅용
      console.log('번역 결과 (처음 200자):', translatedContent.substring(0, 200)); // 디버깅용
      
      // 제목은 번역하지 않고 내용만 번역
      setTranslatedContent(translatedContent);
      
      // 번역 완료 후 바로 번역 내용 표시
      setShowTranslation(true);
      
    } catch (error) {
      console.error('번역 실패:', error);
      setError(error instanceof Error ? error.message : '번역에 실패했습니다.');
    } finally {
      setTranslating(false);
    }
  };

  // 음성 재생/일시정지
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  // 컴포넌트 마운트 시 데이터 가져오기 (한 번만)
  useEffect(() => {
    fetchConversation();
  }, []);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader 
        className="cursor-pointer hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-yellow-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-yellow-300" />
            <span>오늘의 영어공부</span>
          </div>
          {isOpen ? (
            <ChevronUp size={20} className="text-yellow-300" />
          ) : (
            <ChevronDown size={20} className="text-yellow-300" />
          )}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">

          {/* 로딩 상태 */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-2"></div>
              <p className="text-slate-300">오늘의 영어공부를 가져오는 중...</p>
            </div>
          )}

          {/* 오류 상태 */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">오류가 발생했습니다</p>
              <p className="text-sm text-slate-300">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchConversation}
                className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* 영어공부 내용 */}
          {lesson && !loading && !error && (
            <div className="space-y-4">
              {/* 제목 */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="font-semibold text-lg text-slate-200 mb-2">
                  {lesson.title}
                </h3>
                
                {/* 음성 파일 링크 - 제목 아래에 표시 */}
                {lesson.audioUrl && (
                  <div className="mb-3">
                    <audio ref={audioRef} src={lesson.audioUrl} preload="none" />
                    <button
                      onClick={toggleAudio}
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause Audio
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Listen to the Entire Lesson
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Globe className="h-4 w-4" />
                  <span>TalkEnglish.com</span>
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    원본 보기
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* 영어 내용 */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h4 className="font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  영어 내용
                </h4>
                <div 
                  className="text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: removeOnlyLinks(lesson.content) }}
                />

              </div>

              {/* 번역 버튼들 */}
              <div className="text-center space-y-3">
                <div className="flex justify-center gap-2">
                  {/* 번역하기 버튼 - 번역이 없을 때만 표시 */}
                  {!translatedContent && (
                    <Button
                      onClick={handleTranslate}
                      disabled={translating || !lesson.content}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      {translating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          번역 중...
                        </>
                      ) : (
                        '번역하기'
                      )}
                    </Button>
                  )}
                  
                  {/* 번역 보기/숨기기 버튼 - 번역이 있을 때만 표시 */}
                  {translatedContent && (
                    <Button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      {showTranslation ? '번역 숨기기' : '번역 보기'}
                    </Button>
                  )}
                </div>
              </div>

              {/* 번역 결과 */}
              {translatedContent && showTranslation && (
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-400" />
                    한국어 번역
                  </h4>
                  
                  {/* 번역된 내용 */}
                  <div>
                    <h5 className="font-semibold text-green-300 mb-2">내용</h5>
                    <div className="text-green-300 leading-relaxed whitespace-pre-wrap">
                      {translatedContent}
                    </div>
                  </div>
                  

                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
