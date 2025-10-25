
package com.cineforge.app


@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { CineForgeApp() }
    }
}

@Composable
fun CineForgeApp() {
    val nav = rememberNavController()
    MaterialTheme {
        NavHost(navController = nav, startDestination = "prompt") {
            composable("prompt") { PromptScreen(onStart = { prompt -> nav.navigate("project/${prompt}") }) }
            composable("project/{prompt}") { backStackEntry ->
                val prompt = backStackEntry.arguments?.getString("prompt") ?: ""
                ProjectScreen(prompt = prompt)
            }
        }
    }
}

@Composable
fun PromptScreen(onStart: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    Scaffold(
        topBar = { CenterAlignedTopAppBar(title = { Text("CineForge — Make a Movie") }) }
    ) { pad ->
        Column(Modifier.padding(pad).padding(16.dp)) {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text("Describe your movie idea") },
                modifier = Modifier.fillMaxWidth().height(160.dp)
            )
            Spacer(Modifier.height(16.dp))
            Button(enabled = text.isNotBlank(), onClick = { onStart(text.trim()) }) {
                Text("Start Project") }
            Spacer(Modifier.height(8.dp))
            Text("You can edit at every step: outline → screenplay → render.")
        }
    }
}

@Composable
fun ProjectScreen(prompt: String, vm: ProjectViewModel = viewModel()) {
    val state by vm.uiState.collectAsState()
    Scaffold(
        topBar = { CenterAlignedTopAppBar(title = { Text("Project") }) }
    ) { pad ->
        Column(Modifier.padding(pad).padding(16.dp)) {
            Text("Prompt:")
            Text(prompt, style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(12.dp))
            Text("Status: ${state.status}")
            Spacer(Modifier.height(12.dp))
            Button(onClick = { vm.enqueueOrchestration(prompt) }) { Text("Generate Outline") }
            Spacer(Modifier.height(8.dp))
            Button(onClick = { vm.enqueueRenderDemo() }) { Text("Render Demo Scene") }
            Spacer(Modifier.height(16.dp))
            Text("Log:")
            state.log.forEach { Text("• " + it) }
        }
    }
}
