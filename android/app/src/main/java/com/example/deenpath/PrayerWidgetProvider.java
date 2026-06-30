package com.example.deenpath;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class PrayerWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Capacitor Storage uses preferences named "CapacitorStorage"
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String prayerDataStr = prefs.getString("widget_prayer_data", "{}");

        String fajrTime = "--:--";
        String dhuhrTime = "--:--";
        String asrTime = "--:--";
        String maghribTime = "--:--";
        String ishaTime = "--:--";

        try {
            JSONObject data = new JSONObject(prayerDataStr);
            if (data.has("Fajr")) fajrTime = data.getString("Fajr");
            if (data.has("Dhuhr")) dhuhrTime = data.getString("Dhuhr");
            if (data.has("Asr")) asrTime = data.getString("Asr");
            if (data.has("Maghrib")) maghribTime = data.getString("Maghrib");
            if (data.has("Isha")) ishaTime = data.getString("Isha");
        } catch (Exception e) {
            e.printStackTrace();
        }

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prayer);
            
            views.setTextViewText(R.id.fajr_time, fajrTime);
            views.setTextViewText(R.id.dhuhr_time, dhuhrTime);
            views.setTextViewText(R.id.asr_time, asrTime);
            views.setTextViewText(R.id.maghrib_time, maghribTime);
            views.setTextViewText(R.id.isha_time, ishaTime);
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
