const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const aspectRatioToSize = (ratio: string): '1024x1024' | '1024x1792' | '1792x1024' => {
  if (ratio === '9:16' || ratio === '2:3' || ratio === '3:4') return '1024x1792';
  if (ratio === '16:9' || ratio === '3:2' || ratio === '4:3') return '1792x1024';
  return '1024x1024';
};

export const generateImageWithOpenAI = async (
  prompt: string,
  aspectRatio: string,
  quality: 'standard' | 'hd' = 'standard'
): Promise<string | null> => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY chưa được cấu hình');
    return null;
  }

  try {
    const size = aspectRatioToSize(aspectRatio);
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('OpenAI API error:', err);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.url ?? null;
  } catch (error) {
    console.error('Lỗi khi gọi OpenAI Images API:', error);
    return null;
  }
};
