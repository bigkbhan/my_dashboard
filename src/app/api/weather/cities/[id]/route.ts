import { NextRequest, NextResponse } from 'next/server';
import { updateWeatherCity, deleteWeatherCity } from '@/lib/weather-db';

// PUT: 날씨 지역 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효한 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const updatedCity = await updateWeatherCity(id, updateData);
    
    return NextResponse.json({
      message: '날씨 지역이 성공적으로 수정되었습니다.',
      city: updatedCity
    });

  } catch (error) {
    console.error('날씨 지역 수정 오류:', error);
    return NextResponse.json(
      { error: '날씨 지역을 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 날씨 지역 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효한 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await deleteWeatherCity(id);
    
    return NextResponse.json({
      message: '날씨 지역이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('날씨 지역 삭제 오류:', error);
    return NextResponse.json(
      { error: '날씨 지역을 삭제할 수 없습니다.' },
      { status: 500 }
    );
  }
}


