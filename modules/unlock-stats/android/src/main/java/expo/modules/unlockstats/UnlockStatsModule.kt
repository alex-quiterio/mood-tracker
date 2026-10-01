package expo.modules.unlockstats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Counts phone unlocks from the system's usage event log (KEYGUARD_HIDDEN events),
 * the same source Digital Wellbeing uses. Needs the "Usage access" special permission.
 */
class UnlockStatsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  override fun definition() = ModuleDefinition {
    Name("UnlockStats")

    // KEYGUARD_HIDDEN was added in Android 9 (API 28).
    Function("isSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
    }

    Function("hasUsageAccess") {
      hasUsageAccess()
    }

    Function("openUsageAccessSettings") {
      openUsageAccessSettings()
    }

    AsyncFunction("countUnlocksAsync") { startMs: Double, endMs: Double ->
      countUnlocks(startMs.toLong(), endMs.toLong())
    }
  }

  private fun hasUsageAccess(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    if (mode == AppOpsManager.MODE_DEFAULT) {
      return context.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS) ==
        PackageManager.PERMISSION_GRANTED
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun openUsageAccessSettings() {
    // Some devices can open this app's own page directly; others only the full list.
    val direct = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${context.packageName}"))
    val list = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    for (intent in listOf(direct, list)) {
      try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return
      } catch (_: ActivityNotFoundException) {
      }
    }
  }

  /** Returns null when unsupported or when usage access hasn't been granted. */
  private fun countUnlocks(startMs: Long, endMs: Long): Int? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P || !hasUsageAccess()) return null
    val usageStats = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usageStats.queryEvents(startMs, endMs)
    val event = UsageEvents.Event()
    var count = 0
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.eventType == UsageEvents.Event.KEYGUARD_HIDDEN) count++
    }
    return count
  }
}
