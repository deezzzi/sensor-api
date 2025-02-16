"use server";

// Types for sensor data structure
interface SensorData {
  sandLevel: number;
  samplingRate: number;
  sampleInterval: number;
  timestamp: number;
}

// In-memory storage for latest sensor data
let latestSensorData: SensorData = {
  sandLevel: 0,
  samplingRate: 1,
  sampleInterval: 1000,
  timestamp: Date.now(),
};

// GET endpoint - Frontend fetches this
export async function GET() {
  try {
    // Fetch from hardware
    const hardwareUrl = process.env.HARDWARE_IP || 'http://192.168.0.106';
    console.log('Fetching from hardware:', hardwareUrl);

    const response = await fetch(hardwareUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // Disable cache
    });

    if (!response.ok) {
      throw new Error(`Hardware fetch failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received from hardware:', data);

    // Update stored data
    latestSensorData = {
      sandLevel: Number(data.sandLevel),
      samplingRate: Number(data.samplingRate) || 1,
      sampleInterval: Number(data.sampleInterval) || 1000,
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify(latestSensorData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error('Error fetching from hardware:', error);
    // Return last known data if hardware fetch fails
    return new Response(JSON.stringify({
      ...latestSensorData,
      error: 'Hardware connection failed, showing last known data'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  }
}

// POST endpoint - Optional, if hardware needs to push data
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate incoming data
    if (typeof data.sandLevel !== 'number') {
      return new Response(JSON.stringify({ 
        error: 'Invalid data format: sandLevel must be a number' 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Update stored data
    latestSensorData = {
      sandLevel: data.sandLevel,
      samplingRate: data.samplingRate || 1,
      sampleInterval: data.sampleInterval || 1000,
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify({ 
      success: true,
      data: latestSensorData 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('POST Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// OPTIONS endpoint - Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
} 