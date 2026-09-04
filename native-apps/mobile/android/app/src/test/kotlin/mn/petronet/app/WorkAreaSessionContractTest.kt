package mn.petronet.app

import org.junit.Assert.assertEquals
import org.junit.Assume
import org.junit.Test
import java.io.File

/**
 * Ажлын мужийн нэвтрэлт дөрвөн файлын НЭГ мөрөөс хамаарна: серверийн
 * cookie-гийн нэр.
 *
 * Түүнийг Go тал дээр сольвол хаана ч компайлын алдаа гарахгүй — Swift ба
 * Kotlin тал хуучин нэрээ хайсаар байж, гурван клиентийн ажлын муж чимээгүйхэн
 * «нэвтрээгүй» болно. Native тал нэвтэрсэн хэвээр байх тул хүн юу ч буруу
 * болсныг мэдэхгүй: зүгээр л таб нь хоосон.
 *
 * Тиймээс гурвуулыг эх кодоос нь уншиж тулгана. Гүйцэтгэлийн тест биш,
 * гэрээний тест — `CallbackContractTest`-тэй ижил зорилготой.
 */
class WorkAreaSessionContractTest {

    private val repo = File("../../../..")

    private fun read(path: String) = File(repo, path).readText()

    /**
     * Цөмийн Go эх код — модулийн КЭШЭЭС, репогийн модноос биш.
     *
     * Энэ нь Түвшин 2 distribution: `backend/` нь энд байхгүй, цөм нь
     * `go.mod`-оор татагдсан хамаарал. Зам нь тогтмол биш тул хувилбарыг
     * `go.mod`-оос уншаад GOMODCACHE-тэй нийлүүлнэ — `frontend/tests/
     * coreSource.mjs`-ийн яг тэр арга, тэр шалтгаанаар.
     *
     * Кэш байхгүй бол тест АЛГАСАГДАНА (`go mod download` ажиллаагүй шинэ
     * clone). Алгасах нь худал ногооноос дээр: зөрүү нь дараагийн CI дээр
     * баригдана.
     */
    private fun coreCsrfSource(): String? {
        val goMod = File(repo, "go.mod")
        if (!goMod.exists()) return null
        val version = Regex("""github\.com/gerege-systems/open-gerege-nexus/backend (v\S+)""")
            .find(goMod.readText())?.groupValues?.get(1) ?: return null
        val cache = System.getenv("GOMODCACHE")
            ?: File(System.getProperty("user.home"), "go/pkg/mod").path
        val file = File(
            cache,
            "github.com/gerege-systems/open-gerege-nexus/backend@$version" +
                "/internal/kernel/security/csrf.go",
        )
        return if (file.exists()) file.readText() else null
    }

    @Test
    fun everyClientNamesTheServersSessionCookie() {
        // backend/internal/kernel/security/csrf.go:
        //     const TenantSessionCookie = "session_token"
        val csrf = coreCsrfSource()
        Assume.assumeTrue(
            "цөмийн Go модуль кэшэд алга — `go mod download` ажиллуулаад дахин оролдоно уу",
            csrf != null,
        )
        val server = Regex("""TenantSessionCookie\s*=\s*"([^"]+)"""")
            .find(csrf!!)
            ?.groupValues?.get(1)
        assertEquals("csrf.go-оос TenantSessionCookie олдсонгүй", true, server != null)

        val swift = Regex("""cookieName\s*=\s*"([^"]+)"""")
            .find(read("native-apps/desktop/macos/Core/Network/WorkAreaSession.swift"))
            ?.groupValues?.get(1)
        val kotlin = Regex("""COOKIE_NAME\s*=\s*"([^"]+)"""")
            .find(read("native-apps/mobile/android/app/src/main/kotlin/mn/petronet/app/net/WorkAreaSession.kt"))
            ?.groupValues?.get(1)

        assertEquals("macOS/iOS-ийн cookie нэр серверийнхтэй зөрж байна", server, swift)
        assertEquals("Android-ийн cookie нэр серверийнхтэй зөрж байна", server, kotlin)
    }

    @Test
    fun theWorkAreaLoadsTheSameOriginTheApiCalls() {
        // Cookie нь host-only. WebView өөр хостоос ачаалагдвал session хэзээ ч
        // илгээгдэхгүй бөгөөд алдаа нь 401 биш — зүгээр л «нэвтрээгүй» дэлгэц.
        val screen = read("native-apps/mobile/android/app/src/main/kotlin/mn/petronet/app/ui/PlatformScreen.kt")
        assertEquals(
            "Ажлын муж AppConfig.baseUrl-ээс ачаалагдах ЁСТОЙ — өөр хаяг session-ыг тасална",
            true,
            screen.contains("loadUrl(AppConfig.baseUrl)"),
        )
    }
}
