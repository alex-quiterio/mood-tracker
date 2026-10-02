package expo.modules.homewidget

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Lets the app send the widget what to show: today's moods, its words and colours, and where taps go. */
class HomeWidgetModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  override fun definition() = ModuleDefinition {
    Name("HomeWidget")

    Function("isSupported") { true }

    // Saves the state (JSON from JS) and redraws every widget on the home screen.
    Function("update") { stateJson: String ->
      MoodWidgetProvider.saveState(context, stateJson)
      MoodWidgetProvider.redrawAll(context)
    }
  }
}
