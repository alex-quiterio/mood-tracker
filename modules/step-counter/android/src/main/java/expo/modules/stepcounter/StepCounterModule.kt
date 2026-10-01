package expo.modules.stepcounter

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Reads the hardware step counter (TYPE_STEP_COUNTER): total steps since the
 * phone last booted. The sensor counts even while the app is closed, so the app
 * only needs to read it at check-in time and subtract the previous reading.
 */
class StepCounterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  private val sensorManager: SensorManager?
    get() = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  override fun definition() = ModuleDefinition {
    Name("StepCounter")

    Function("isSupported") {
      sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
    }

    // Android 10+ needs the "Physical activity" runtime permission; JS requests it.
    Function("hasPermission") {
      Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
        context.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED
    }

    // Resolves { steps, bootTime } or null when unavailable or the sensor doesn't answer in time.
    AsyncFunction("readAsync") { promise: Promise ->
      read(promise)
    }
  }

  private fun read(promise: Promise) {
    val manager = sensorManager
    val sensor = manager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    if (manager == null || sensor == null) {
      promise.resolve(null)
      return
    }
    val done = AtomicBoolean(false)
    val handler = Handler(Looper.getMainLooper())

    val listener = object : SensorEventListener {
      override fun onSensorChanged(event: SensorEvent) {
        if (!done.compareAndSet(false, true)) return
        manager.unregisterListener(this)
        handler.removeCallbacksAndMessages(null)
        promise.resolve(
          mapOf(
            "steps" to event.values[0].toDouble(),
            "bootTime" to (System.currentTimeMillis() - SystemClock.elapsedRealtime()).toDouble(),
          )
        )
      }

      override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

    // On-change sensors report their current value right after registering.
    val registered = try {
      manager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL, handler)
    } catch (_: SecurityException) {
      false
    }
    if (!registered) {
      done.set(true)
      promise.resolve(null)
      return
    }
    handler.postDelayed({
      if (done.compareAndSet(false, true)) {
        manager.unregisterListener(listener)
        promise.resolve(null)
      }
    }, TIMEOUT_MS)
  }

  companion object {
    private const val TIMEOUT_MS = 5000L
  }
}
