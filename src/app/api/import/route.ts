import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, prompt, game_id, type } = body;

    if (!provider || !prompt || !game_id || !type) {
      return NextResponse.json(
        { error: 'provider, prompt, game_id, and type are required' },
        { status: 400 }
      );
    }

    const validProviders = ['openai', 'claude', 'gemini'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const validTypes = ['pois', 'routes', 'table'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Mock responses based on the requested type
    let data;

    if (type === 'pois') {
      data = {
        type: 'pois',
        items: [
          {
            id: uuidv4(),
            name: 'Sample Location',
            description: 'A sample point of interest generated from your prompt',
            lat: 45.0,
            lng: -90.0,
            icon: 'marker',
            color: '#ff0000',
            metadata: {},
          },
          {
            id: uuidv4(),
            name: 'Another Location',
            description: 'Another sample POI',
            lat: 46.0,
            lng: -89.0,
            icon: 'marker',
            color: '#00ff00',
            metadata: {},
          },
        ],
      };
    } else if (type === 'routes') {
      data = {
        type: 'routes',
        items: [
          {
            id: uuidv4(),
            name: 'Sample Route',
            description: 'A sample route generated from your prompt',
            color: '#ff0000',
            weight: 3,
            points: [
              [45.0, -90.0],
              [45.5, -89.5],
              [46.0, -89.0],
            ],
            metadata: {},
          },
        ],
      };
    } else {
      data = {
        type: 'table',
        name: 'Generated Table',
        slug: 'generated-table',
        columns: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'value', label: 'Value', type: 'number' },
          { key: 'description', label: 'Description', type: 'text' },
        ],
        data: [
          { name: 'Item 1', value: 100, description: 'First sample item' },
          { name: 'Item 2', value: 200, description: 'Second sample item' },
        ],
      };
    }

    return NextResponse.json({
      provider,
      prompt,
      game_id,
      generated: data,
      message:
        'This is a mock response. AI integration will be added later.',
    });
  } catch (error) {
    console.error('Error in import:', error);
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
  }
}
