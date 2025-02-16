"use server";

// Types
interface SensorData {
  sandLevel: number;
  samplingRate: number;
  sampleInterval: number;
  timestamp: number;
}

// In-memory storage for sensor data
let latestSensorData: SensorData = {
  sandLevel: 0,
  samplingRate: 1,
  sampleInterval: 1000,
  timestamp: Date.now(),
};

// GET handler returns the last received sensor data
export async function GET() {
  try {
    // For testing/development, generate random data
    const data: SensorData = {
      sandLevel: Math.floor(Math.random() * 1000),
      samplingRate: 1,
      sampleInterval: 1000,
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error('GET Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// POST handler receives data from the Arduino/sensor
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate incoming data
    if (typeof data.sandLevel !== 'number') {
      throw new Error("Invalid data format: sandLevel must be a number");
    }

    // Update stored data
    latestSensorData = {
      sandLevel: data.sandLevel,
      samplingRate: data.samplingRate || 1,
      sampleInterval: data.sampleInterval || 1000,
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify({ 
      message: "Data updated successfully",
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
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}