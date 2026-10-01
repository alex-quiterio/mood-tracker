package expo.modules.stepcounter

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.fitness.FitnessLocal
import com.google.android.gms.fitness.LocalRecordingClient
import com.google.android.gms.fitness.data.LocalBucket
import com.google.android.gms.fitness.data.LocalDataPoint
import com.google.android.gms.fitness.data.LocalDataSet
import com.google.android.gms.fitness.data.LocalDataType
import com.google.android.gms.fitness.data.LocalField
import com.google.android.gms.fitness.request.LocalDataReadRequest
import com.google.android.gms.fitness.result.LocalDataReadResponse
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

/**
 * Steps from Google Play services' Recording API on mobile. Once subscribed, Play
 * services records steps in the background (battery-efficiently, no account) and
 * keeps up to 10 days, so the app can ask for the steps between any two times.
 *
 * The raw hardware step counter can't do this: it only counts while some app
 * keeps listening to it.
 */
class StepCounterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  private val client: LocalRecordingClient
    get() = FitnessLocal.getLocalRecordingClient(context)

  override fun definition() = ModuleDefinition {
    Name("StepCounter")

    // Needs a recent enough Google Play services.
    Function("isSupported") {
      isSupported()
    }

    // Android 10+ needs the "Physical activity" runtime permission; JS requests it.
    Function("hasPermission") {
      hasPermission()
    }

    // Starts (or renews) recording. Resolves false when unsupported, not permitted or refused.
    AsyncFunction("subscribeAsync") { promise: Promise ->
      if (!isSupported() || !hasPermission()) {
        promise.resolve(false)
        return@AsyncFunction
      }
      client.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA)
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { promise.resolve(false) }
    }

    // Steps between two times (ms since epoch), or null when they can't be read.
    AsyncFunction("countStepsAsync") { startMs: Double, endMs: Double, promise: Promise ->
      countSteps(startMs.toLong(), endMs.toLong(), promise)
    }
  }

  private fun isSupported(): Boolean =
    GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
      context,
      LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE,
    ) == ConnectionResult.SUCCESS

  private fun hasPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
      context.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED

  private fun countSteps(startMs: Long, endMs: Long, promise: Promise) {
    if (!isSupported() || !hasPermission()) {
      promise.resolve(null)
      return
    }
    if (endMs <= startMs) {
      promise.resolve(0)
      return
    }
    val request = LocalDataReadRequest.Builder()
      .aggregate(LocalDataType.TYPE_STEP_COUNT_DELTA)
      .bucketByTime(1, TimeUnit.DAYS)
      .setTimeRange(startMs, endMs, TimeUnit.MILLISECONDS)
      .build()
    client.readData(request)
      .addOnSuccessListener { response: LocalDataReadResponse ->
        var steps = 0
        for (bucket in response.buckets) {
          for (set in (bucket as LocalBucket).dataSets) {
            for (point in (set as LocalDataSet).dataPoints) {
              steps += (point as LocalDataPoint).getValue(LocalField.FIELD_STEPS).asInt()
            }
          }
        }
        promise.resolve(steps)
      }
      .addOnFailureListener { promise.resolve(null) }
  }
}
