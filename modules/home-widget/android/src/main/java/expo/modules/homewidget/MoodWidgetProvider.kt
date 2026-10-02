package expo.modules.homewidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The home-screen widget: today's three check-ins and a pause. The app sends the
 * state (see HomeWidgetModule); this only draws it. Taps open the app on a link
 * the app chose, so all words and rules stay in JS.
 */
class MoodWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) manager.updateAppWidget(id, views(context))
  }

  companion object {
    private const val PREFS = "mood-tracker-widget"
    private const val STATE_KEY = "state"
    private val SLOTS = listOf("morning", "afternoon", "evening")

    fun saveState(context: Context, json: String) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(STATE_KEY, json).apply()
    }

    fun redrawAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, MoodWidgetProvider::class.java))
      for (id in ids) manager.updateAppWidget(id, views(context))
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

    private fun views(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.mood_widget)
      val state = loadState(context)
      // Before the app has sent anything, every tap simply opens it.
      views.setOnClickPendingIntent(R.id.mood_widget_root, openApp(context, null, 0))
      if (state == null) return views

      // After midnight, yesterday's moods no longer belong to "today".
      val fresh = state.optString("date") == today()
      val empty = state.optString("empty", "○")
      val colors = state.optJSONObject("colors")
      val text = color(colors, "text")
      val muted = color(colors, "muted")
      color(colors, "surface")?.let { views.setInt(R.id.mood_widget_background, "setColorFilter", it) }
      text?.let { views.setTextColor(R.id.mood_widget_title, it) }
      color(colors, "accent")?.let { views.setTextColor(R.id.mood_widget_pause, it) }

      views.setTextViewText(R.id.mood_widget_title, state.optString("title"))
      views.setTextViewText(R.id.mood_widget_pause, state.optString("pause"))
      views.setOnClickPendingIntent(R.id.mood_widget_pause, openApp(context, state.optString("pauseLink"), 1))

      val slots = state.optJSONArray("slots")
      for (i in SLOTS.indices) {
        val slot = slots?.optJSONObject(i) ?: continue
        val emoji = if (fresh) slot.optString("emoji") else ""
        val done = emoji.isNotEmpty()
        views.setTextViewText(emojiId(i), if (done) emoji else empty)
        views.setTextViewText(labelId(i), slot.optString("label"))
        (if (done) text else muted)?.let { views.setTextColor(labelId(i), it) }
        muted?.let { views.setTextColor(emojiId(i), it) }
        views.setContentDescription(slotId(i), slot.optString("a11y"))
        views.setOnClickPendingIntent(slotId(i), openApp(context, slot.optString("link"), 2 + i))
      }
      return views
    }

    private fun color(colors: JSONObject?, key: String): Int? =
      colors?.optString(key)?.takeIf { it.isNotEmpty() }?.let {
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

    private fun slotId(i: Int) =
      listOf(R.id.mood_widget_slot_morning, R.id.mood_widget_slot_afternoon, R.id.mood_widget_slot_evening)[i]

    private fun emojiId(i: Int) =
      listOf(R.id.mood_widget_emoji_morning, R.id.mood_widget_emoji_afternoon, R.id.mood_widget_emoji_evening)[i]

    private fun labelId(i: Int) =
      listOf(R.id.mood_widget_label_morning, R.id.mood_widget_label_afternoon, R.id.mood_widget_label_evening)[i]
  }
}
