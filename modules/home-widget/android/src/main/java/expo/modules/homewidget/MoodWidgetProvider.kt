package expo.modules.homewidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * The home-screen widget: a greeting and a pause, today's check-ins as mood-coloured
 * tiles, the week as dots and the quote of the day. The app sends the state (see
 * HomeWidgetModule), including tomorrow's day and quote, so the widget can move on at
 * midnight by itself. This only draws; taps open the app on links the app chose.
 */
class MoodWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) redraw(context, manager, id)
  }

  // Resizing changes what fits.
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
    redraw(context, manager, id)
  }

  companion object {
    private const val PREFS = "mood-tracker-widget"
    private const val STATE_KEY = "state"
    private val SLOTS = listOf("morning", "afternoon", "evening")

    /** Heights (dp) from which the week and then the quote fit under the tiles. */
    private const val WEEK_MIN_HEIGHT = 165
    private const val QUOTE_MIN_HEIGHT = 250

    fun saveState(context: Context, json: String) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(STATE_KEY, json).apply()
    }

    fun redrawAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, MoodWidgetProvider::class.java))
      for (id in ids) redraw(context, manager, id)
    }

    private fun redraw(context: Context, manager: AppWidgetManager, id: Int) {
      // The portrait height; 0 when the launcher hasn't said, which means the smallest layout.
      val height = manager.getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)
      manager.updateAppWidget(id, views(context, height))
    }

    private fun loadState(context: Context): JSONObject? =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(STATE_KEY, null)?.let {
        try {
          JSONObject(it)
        } catch (e: Exception) {
          null
        }
      }

    /** Local date as YYYY-MM-DD, the same format the app uses. */
    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    /** The app's rule: before 12:00 is morning, before 18:00 afternoon, otherwise evening. */
    private fun slotNow(): Int {
      val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
      return if (hour < 12) 0 else if (hour < 18) 1 else 2
    }

    private fun views(context: Context, heightDp: Int): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.mood_widget)
      // Before the app has sent anything, every tap simply opens it.
      views.setOnClickPendingIntent(R.id.mood_widget_root, openApp(context, null, 0))
      val state = loadState(context) ?: return views

      val today = today()
      // After midnight, yesterday's moods no longer belong to "today".
      val fresh = state.optString("date") == today
      val colors = state.optJSONObject("colors")
      val text = color(colors, "text")
      val muted = color(colors, "muted")
      val accent = color(colors, "accent")
      val empty = color(colors, "empty")
      val onMood = color(colors, "onMood")

      color(colors, "surface")?.let { views.setInt(R.id.mood_widget_background, "setColorFilter", it) }
      text?.let { views.setTextColor(R.id.mood_widget_title, it) }
      accent?.let { views.setTextColor(R.id.mood_widget_pause, it) }

      val now = slotNow()
      views.setTextViewText(R.id.mood_widget_title, state.optJSONArray("greetings")?.optString(now) ?: "")
      views.setTextViewText(R.id.mood_widget_pause, state.optString("pause"))
      views.setOnClickPendingIntent(R.id.mood_widget_pause, openApp(context, state.optString("pauseLink"), 1))

      val slots = state.optJSONArray("slots")
      for (i in SLOTS.indices) {
        val slot = slots?.optJSONObject(i) ?: continue
        val done = fresh && slot.optString("emoji").isNotEmpty()
        views.setTextViewText(EMOJI[i], if (done) slot.optString("emoji") else state.optString("empty", "○"))
        views.setTextViewText(LABEL[i], slot.optString("label"))
        val tile = if (done) color(slot, "color") else empty
        tile?.let { views.setInt(TILE[i], "setColorFilter", it) }
        (if (done) onMood else muted)?.let {
          views.setTextColor(EMOJI[i], it)
          views.setTextColor(LABEL[i], it)
        }
        accent?.let { views.setInt(RING[i], "setColorFilter", it) }
        views.setViewVisibility(RING[i], if (i == now) View.VISIBLE else View.GONE)
        views.setContentDescription(SLOT[i], slot.optString(if (done) "a11yDone" else "a11yEmpty"))
        views.setOnClickPendingIntent(SLOT[i], openApp(context, slot.optString("link"), 2 + i))
      }

      val showWeek = drawWeek(views, state.optJSONArray("week"), today, colors) && heightDp >= WEEK_MIN_HEIGHT
      views.setViewVisibility(R.id.mood_widget_week, if (showWeek) View.VISIBLE else View.GONE)
      views.setOnClickPendingIntent(R.id.mood_widget_week, openApp(context, state.optString("weekLink"), 5))

      val showQuote = drawQuote(views, state.optJSONArray("quotes"), today, text, muted) &&
        heightDp >= QUOTE_MIN_HEIGHT
      views.setViewVisibility(R.id.mood_widget_quote, if (showQuote) View.VISIBLE else View.GONE)
      return views
    }

    /** The 7 days ending today, from the 8 the app sent (the week plus tomorrow). False when none fit. */
    private fun drawWeek(views: RemoteViews, week: JSONArray?, today: String, colors: JSONObject?): Boolean {
      if (week == null) return false
      val end = (0 until week.length()).firstOrNull { week.optJSONObject(it)?.optString("date") == today } ?: return false
      if (end < 6) return false
      val text = color(colors, "text")
      val muted = color(colors, "muted")
      val empty = color(colors, "empty")
      for (i in 0 until 7) {
        val day = week.optJSONObject(end - 6 + i) ?: return false
        views.setTextViewText(DAY[i], day.optString("initial"))
        (if (i == 6) text else muted)?.let { views.setTextColor(DAY[i], it) }
        (color(day, "color") ?: empty)?.let { views.setInt(DOT[i], "setColorFilter", it) }
      }
      return true
    }

    /** Today's quote, from the ones the app sent for today and tomorrow. False when there is none. */
    private fun drawQuote(views: RemoteViews, quotes: JSONArray?, today: String, text: Int?, muted: Int?): Boolean {
      val quote = (0 until (quotes?.length() ?: 0))
        .mapNotNull { quotes?.optJSONObject(it) }
        .firstOrNull { it.optString("date") == today } ?: return false
      views.setTextViewText(R.id.mood_widget_quote_text, "“${quote.optString("text")}”")
      val source = quote.optString("source")
      views.setTextViewText(R.id.mood_widget_quote_source, if (source.isEmpty()) "" else "— $source")
      views.setViewVisibility(R.id.mood_widget_quote_source, if (source.isEmpty()) View.GONE else View.VISIBLE)
      text?.let { views.setTextColor(R.id.mood_widget_quote_text, it) }
      muted?.let { views.setTextColor(R.id.mood_widget_quote_source, it) }
      return true
    }

    private fun color(obj: JSONObject?, key: String): Int? =
      obj?.optString(key)?.takeIf { it.isNotEmpty() }?.let {
        try {
          Color.parseColor(it)
        } catch (e: IllegalArgumentException) {
          null
        }
      }

    /** Opens the app's own activity, with `link` as the intent data that JS reads through Linking. */
    private fun openApp(context: Context, link: String?, requestCode: Int): PendingIntent {
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
      val intent = Intent(Intent.ACTION_VIEW).apply {
        component = launch.component
        if (!link.isNullOrEmpty()) data = Uri.parse(link)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      return PendingIntent.getActivity(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    private val SLOT = listOf(R.id.mood_widget_slot_morning, R.id.mood_widget_slot_afternoon, R.id.mood_widget_slot_evening)
    private val TILE = listOf(R.id.mood_widget_tile_morning, R.id.mood_widget_tile_afternoon, R.id.mood_widget_tile_evening)
    private val RING = listOf(R.id.mood_widget_ring_morning, R.id.mood_widget_ring_afternoon, R.id.mood_widget_ring_evening)
    private val EMOJI = listOf(R.id.mood_widget_emoji_morning, R.id.mood_widget_emoji_afternoon, R.id.mood_widget_emoji_evening)
    private val LABEL = listOf(R.id.mood_widget_label_morning, R.id.mood_widget_label_afternoon, R.id.mood_widget_label_evening)
    private val DOT = listOf(
      R.id.mood_widget_dot_0, R.id.mood_widget_dot_1, R.id.mood_widget_dot_2, R.id.mood_widget_dot_3,
      R.id.mood_widget_dot_4, R.id.mood_widget_dot_5, R.id.mood_widget_dot_6,
    )
    private val DAY = listOf(
      R.id.mood_widget_day_0, R.id.mood_widget_day_1, R.id.mood_widget_day_2, R.id.mood_widget_day_3,
      R.id.mood_widget_day_4, R.id.mood_widget_day_5, R.id.mood_widget_day_6,
    )
  }
}
