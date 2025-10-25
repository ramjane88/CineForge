
package com.cineforge.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

data class UiState(
    val status: String = "Idle",
    val log: List<String> = emptyList()
)

class ProjectViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState

    fun enqueueOrchestration(prompt: String) {
        append("Queued outline generation for: $prompt")
        // In real app, call backend API here
        append("(stub) Outline created.")
        _uiState.value = _uiState.value.copy(status = "Outline ready")
    }

    fun enqueueRenderDemo() {
        append("Queued demo scene render (stub)")
        _uiState.value = _uiState.value.copy(status = "Rendering demo...")
    }

    private fun append(msg: String) {
        _uiState.value = _uiState.value.copy(log = _uiState.value.log + msg)
    }
}
