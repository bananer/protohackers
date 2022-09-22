package world.nagler.philip

import io.ktor.network.selector.*
import io.ktor.network.sockets.*
import io.ktor.utils.io.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

class ChatException(message: String) : Exception(message)

fun main() {
    runBlocking {
        val selectorManager = SelectorManager(Dispatchers.IO)
        val port = (System.getenv("PORT") ?: "2345").toInt()
        val serverSocket = aSocket(selectorManager).tcp().bind(port = port)
        println("Chat Server listening at ${serverSocket.localAddress}")

        val users = mutableMapOf<String, ByteWriteChannel>()

        while (true) {
            val socket = serverSocket.accept()
            println("Accepted ${socket.remoteAddress}")
            launch {
                val read = socket.openReadChannel()
                val write = socket.openWriteChannel(autoFlush = true)

                try {
                    write.writeStringUtf8("Welcome, friend! What's your name?\n")
                    val userName = read.readUTF8Line(32)

                    if (userName == null || !userName.chars().allMatch { Character.isLetterOrDigit(it) }) {
                        throw ChatException("Invalid Username")
                    }
                    if (users.containsKey(userName)) {
                        throw ChatException("Username already in use")
                    }

                    println("$userName joined.")

                    write.writeStringUtf8("* You may now chat with: ${users.keys.joinToString(", ")}\n")

                    users.forEach { it.value.writeStringUtf8("* New user: ${userName}\n") }

                    users[userName] = write

                    try {
                        while (!socket.isClosed) {
                            val line = read.readUTF8Line()?.trim() ?: throw ChatException("Goodbye")

                            if (line.isNotBlank()) {
                                users.filter { it.key != userName }
                                    .forEach { it.value.writeStringUtf8("[${userName}] $line\n") }
                            }
                        }
                    } finally {
                        users.remove(userName)
                        users.forEach { it.value.writeStringUtf8("* Goodbye, ${userName}\n") }
                        println("$userName left.")
                    }
                } catch (e: Throwable) {
                    if (e is ChatException) {
                        write.writeStringUtf8(e.message ?: "bye")
                    }

                    withContext(Dispatchers.IO) {
                        socket.close()
                    }
                }
            }
        }
    }

}
