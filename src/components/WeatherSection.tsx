'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, RefreshCw, MapPin, Settings, Edit, Trash2, GripVertical, X, Cloud } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WeatherData {
  time: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
}

interface WeatherCity {
  id: number;
  city_code: string;
  city_name: string;
  english_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


// 드래그 앤 드롭을 위한 SortableItem 컴포넌트
function SortableItem({ city, onEdit, onDelete }: { 
  city: WeatherCity; 
  onEdit: (city: WeatherCity) => void; 
  onDelete: (id: number) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: city.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg"
    >
      <div {...attributes} {...listeners}>
        <GripVertical size={16} className="text-slate-400 cursor-grab" />
      </div>
      <div className="flex-1">
        <div className="text-white text-sm font-medium">{city.city_name}</div>
        <div className="text-slate-400 text-xs">{city.city_code}</div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(city)}
          className="p-1 hover:bg-slate-600 rounded transition-colors"
          title="수정"
        >
          <Edit size={14} className="text-slate-300" />
        </button>
        <button
          onClick={() => onDelete(city.id)}
          className="p-1 hover:bg-slate-600 rounded transition-colors"
          title="삭제"
        >
          <Trash2 size={14} className="text-slate-300" />
        </button>
      </div>
    </div>
  );
}

export default function WeatherSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('Seoul');
  const [currentCityName, setCurrentCityName] = useState('서울');
  const [cities, setCities] = useState<WeatherCity[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localCities, setLocalCities] = useState<WeatherCity[]>([]);
  const [newCity, setNewCity] = useState({ city_code: '', city_name: '', english_name: '' });
  const [editingCity, setEditingCity] = useState<WeatherCity | null>(null);

  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch('/api/weather/cities');
      const data = await response.json();
      
      if (response.ok && data.cities) {
        setCities(data.cities);
      }
    } catch (error) {
      console.error('도시 목록 조회 실패:', error);
    }
  }, []);

  const fetchWeatherData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshMessage('날씨 데이터를 조회하는 중...');
        setRefreshing(true);
        setWeatherData([]);
        setError(null);
      }

      const response = await fetch(`/api/weather?city=${selectedCity}&country=KR`);
      const data = await response.json();
      
      if (!response.ok) {
        // API에서 반환된 오류 메시지 사용
        if (data.error && data.details) {
          throw new Error(`${data.error}: ${data.details}`);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(`날씨 API 응답 오류 (${response.status})`);
        }
      }

             if (data.forecast && Array.isArray(data.forecast)) {
        setWeatherData(data.forecast);
        // 선택된 도시의 한글 이름 찾기
        const selectedCityData = cities.find(city => city.city_code === selectedCity);
        setCurrentCityName(selectedCityData ? selectedCityData.city_name : selectedCity);
        setError(null);
      } else {
        throw new Error('날씨 데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('날씨 데이터 조회 실패:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('날씨 데이터를 불러올 수 없습니다.');
      }
      setWeatherData([]);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
        setRefreshMessage(null);
      }
    }
  }, [selectedCity, cities]);

  useEffect(() => {
    // 페이지 로드 시에만 초기 데이터 조회
    fetchWeatherData();
    fetchCities();
  }, []); // 빈 의존성 배열로 초기 로드 시에만 실행

  useEffect(() => {
    // selectedCity가 변경될 때만 데이터 조회 (초기 로드 제외)
    if (weatherData.length > 0 && cities.length > 0) {
      fetchWeatherData();
    }
  }, [selectedCity, cities]);

  useEffect(() => {
    // cities prop과 localCities state 동기화
    setLocalCities(cities);
  }, [cities]);


  const getWeatherIcon = (iconCode: string) => {
    // OpenWeatherMap 아이콘 코드에 따른 아이콘 매핑
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', // 맑음 (낮)
      '01n': '🌙', // 맑음 (밤)
      '02d': '⛅', // 구름 조금 (낮)
      '02n': '☁️', // 구름 조금 (밤)
      '03d': '☁️', // 구름 많음
      '03n': '☁️', // 구름 많음
      '04d': '☁️', // 흐림
      '04n': '☁️', // 흐림
      '09d': '🌧️', // 소나기
      '09n': '🌧️', // 소나기
      '10d': '🌦️', // 비 (낮)
      '10n': '🌧️', // 비 (밤)
      '11d': '⛈️', // 천둥번개
      '11n': '⛈️', // 천둥번개
      '13d': '❄️', // 눈
      '13n': '❄️', // 눈
      '50d': '🌫️', // 안개
      '50n': '🌫️', // 안개
    };
    
    return iconMap[iconCode] || '🌤️';
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };


  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = event.target.value;
    setSelectedCity(newCity);
    // 도시가 변경되면 자동으로 데이터를 새로 조회합니다
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // 설정 창이 닫힐 때 날씨 데이터 새로고침
    fetchWeatherData(true);
  };

  const handleAddCity = async () => {
    if (!newCity.city_code || !newCity.city_name || !newCity.english_name) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/weather/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCity)
      });

      if (response.ok) {
        const data = await response.json();
        setLocalCities([...localCities, data.city]);
        setNewCity({ city_code: '', city_name: '', english_name: '' });
        await fetchCities(); // DB에서 최신 데이터 가져오기
      }
    } catch (error) {
      console.error('도시 추가 실패:', error);
      alert('도시 추가에 실패했습니다.');
    }
  };

  const handleEditCity = (city: WeatherCity) => {
    setEditingCity(city);
    setNewCity({
      city_code: city.city_code,
      city_name: city.city_name,
      english_name: city.english_name
    });
  };

  const handleUpdateCity = async () => {
    if (!editingCity || !newCity.city_name || !newCity.english_name) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/weather/cities/${editingCity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_name: newCity.city_name,
          english_name: newCity.english_name
        })
      });

      if (response.ok) {
        const updatedCity = localCities.map(city => 
          city.id === editingCity.id 
            ? { ...city, city_name: newCity.city_name, english_name: newCity.english_name }
            : city
        );
        setLocalCities(updatedCity);
        setEditingCity(null);
        setNewCity({ city_code: '', city_name: '', english_name: '' });
        await fetchCities(); // DB에서 최신 데이터 가져오기
      }
    } catch (error) {
      console.error('도시 수정 실패:', error);
      alert('도시 수정에 실패했습니다.');
    }
  };

  const handleDeleteCity = async (cityId: number) => {
    if (!confirm('정말로 이 도시를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/weather/cities/${cityId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedCities = localCities.filter(city => city.id !== cityId);
        setLocalCities(updatedCities);
        await fetchCities(); // DB에서 최신 데이터 가져오기
      }
    } catch (error) {
      console.error('도시 삭제 실패:', error);
      alert('도시 삭제에 실패했습니다.');
    }
  };

  const handleReorderCities = async (reorderedCities: WeatherCity[]) => {
    setLocalCities(reorderedCities);
    
    try {
      const citiesForReorder = reorderedCities.map((city, index) => ({
        id: city.id,
        display_order: index + 1
      }));

      await fetch('/api/weather/cities/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities: citiesForReorder })
      });
    } catch (error) {
      console.error('도시 순서 변경 실패:', error);
      alert('도시 순서 변경에 실패했습니다.');
    }
  };

  const cancelEdit = () => {
    setEditingCity(null);
    setNewCity({ city_code: '', city_name: '', english_name: '' });
  };

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localCities.findIndex(city => city.id === active.id);
      const newIndex = localCities.findIndex(city => city.id === over.id);
      
      const reorderedCities = arrayMove(localCities, oldIndex, newIndex);
      handleReorderCities(reorderedCities);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
          <Cloud className="h-5 w-5 text-yellow-300" />
          오늘의 날씨
        </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-300">데이터를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
                   <CardHeader className="cursor-pointer hover:bg-slate-700/50 transition-colors">
                       <CardTitle className="text-yellow-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-yellow-300" />
                <span>오늘의 날씨</span>
              </div>
              <div className="flex items-center gap-2">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   fetchWeatherData(true);
                 }}
                 className="p-1 hover:bg-slate-600/50 rounded transition-colors disabled:opacity-50"
                 title="새로고침"
                 disabled={refreshing}
               >
                 <RefreshCw size={16} className={`text-yellow-300 hover:text-yellow-200 ${refreshing ? 'animate-spin' : ''}`} />
               </button>
               {isOpen ? <ChevronUp size={20} className="text-yellow-300" /> : <ChevronDown size={20} className="text-yellow-300" />}
             </div>
           </CardTitle>
         </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
                         {/* 도시 선택 */}
             <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2">
                   <MapPin size={16} className="text-slate-300" />
                   <span className="text-slate-300 text-sm">지역 선택:</span>
                 </div>
                 <select
                   value={selectedCity}
                   onChange={handleCityChange}
                   className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   {localCities.map((city) => (
                     <option key={city.city_code} value={city.city_code}>
                       {city.city_name}
                     </option>
                   ))}
                 </select>
               </div>
               <button
                 onClick={() => setIsDialogOpen(true)}
                 className="h-8 px-2 text-slate-300 hover:text-white hover:bg-slate-600/50 rounded transition-colors flex items-center"
                 title="지역 설정"
               >
                 <Settings size={16} className="mr-1" />
                 <span className="text-sm">설정</span>
               </button>
             </div>

            {/* 새로고침 메시지 */}
            {refreshMessage && refreshing && (
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <div className="text-blue-300 text-sm text-center">
                  <RefreshCw size={16} className="inline animate-spin mr-2" />
                  {refreshMessage}
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="text-red-300 text-sm">
                  <strong>오류 발생:</strong> {error}
                </div>
              </div>
            )}

            {/* 날씨 정보 */}
            {weatherData.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {weatherData.map((weather, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/50 rounded-lg text-center">
                    <div className="text-slate-300 text-xs mb-2">
                      {formatTime(weather.time)}
                    </div>
                    <div className="text-3xl mb-2">
                      {getWeatherIcon(weather.icon)}
                    </div>
                    <div className="text-white font-semibold text-sm mb-1">
                      {Math.round(weather.temperature)}°C
                    </div>
                    <div className="text-slate-400 text-xs">
                      습도 {weather.humidity}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                {error ? '날씨 데이터를 불러올 수 없습니다.' : '날씨 데이터가 없습니다.'}
              </div>
            )}

                         {/* 정보 출처 */}
             <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
               <div className="text-center text-slate-300 text-sm">
                 <p>OpenWeatherMap API를 통해 제공되는 날씨 정보</p>
                 <p className="mt-1">3시간 단위로 업데이트되는 일기예보 • {currentCityName} 지역</p>
               </div>
             </div>
           </CardContent>
         </CollapsibleContent>
       </Collapsible>

       {/* 지역 설정 모달 */}
       {isDialogOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-white text-lg font-semibold">지역 설정</h3>
               <button
                 onClick={handleDialogClose}
                 className="p-1 hover:bg-slate-700 rounded transition-colors"
               >
                 <X size={20} className="text-slate-300" />
               </button>
             </div>

             {/* 새 지역 추가/수정 폼 */}
             <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
               <h4 className="text-white text-sm font-medium mb-3">
                 {editingCity ? '지역 수정' : '새 지역 추가'}
               </h4>
               <div className="space-y-3">
                 <div>
                   <label className="block text-slate-300 text-xs mb-1">도시 코드</label>
                   <input
                     type="text"
                     value={newCity.city_code}
                     onChange={(e) => setNewCity({ ...newCity, city_code: e.target.value })}
                     disabled={!!editingCity}
                     className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                     placeholder="예: Seoul"
                   />
                 </div>
                 <div>
                   <label className="block text-slate-300 text-xs mb-1">도시명 (한글)</label>
                   <input
                     type="text"
                     value={newCity.city_name}
                     onChange={(e) => setNewCity({ ...newCity, city_name: e.target.value })}
                     className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="예: 서울"
                   />
                 </div>
                 <div>
                   <label className="block text-slate-300 text-xs mb-1">도시명 (영문)</label>
                   <input
                     type="text"
                     value={newCity.english_name}
                     onChange={(e) => setNewCity({ ...newCity, english_name: e.target.value })}
                     className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="예: Seoul"
                   />
                 </div>
                 <div className="flex gap-2">
                   {editingCity ? (
                     <>
                       <button
                         onClick={handleUpdateCity}
                         className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 px-4 rounded transition-colors"
                       >
                         수정
                       </button>
                       <button
                         onClick={cancelEdit}
                         className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm py-2 px-4 rounded transition-colors"
                       >
                         취소
                       </button>
                     </>
                   ) : (
                     <button
                       onClick={handleAddCity}
                       className="w-full bg-green-600 hover:bg-green-500 text-white text-sm py-2 px-4 rounded transition-colors"
                     >
                       추가
                     </button>
                   )}
                 </div>
               </div>
             </div>

                           {/* 지역 목록 */}
              <div>
                <h4 className="text-white text-sm font-medium mb-3">지역 목록 (드래그하여 순서 변경)</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localCities.map(city => city.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localCities.map((city) => (
                        <SortableItem
                          key={city.id}
                          city={city}
                          onEdit={handleEditCity}
                          onDelete={handleDeleteCity}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
           </div>
         </div>
       )}
     </Card>
   );
 }
