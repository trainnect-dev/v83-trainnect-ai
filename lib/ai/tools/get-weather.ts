import { tool } from 'ai';
import { z } from 'zod';
import * as Langtrace from '@langtrase/typescript-sdk';

export const getWeather = tool({
  description: 'Get the current weather at a location',
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
        );

        const weatherData = await response.json();
        return weatherData;
      }, {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        api: 'open-meteo',
      });
    }, 'get_weather_tool');
  },
});
