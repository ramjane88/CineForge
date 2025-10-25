
package com.cineforge.app

import retrofit2.http.Body
import retrofit2.http.POST

data class PromptRequest(val prompt: String)
data class OutlineResponse(val title: String, val logline: String)

interface CineForgeApi {
    @POST("/v1/outline")
    suspend fun makeOutline(@Body req: PromptRequest): OutlineResponse
}
