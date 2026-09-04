// ҮҮСГЭСЭН ФАЙЛ — scripts/gen_from_swift.py. Гараар бүү зас.
// Эх сурвалж: native-apps/desktop/macos/Design/Colors.swift

package mn.petronet.app.ui.theme

import androidx.compose.ui.graphics.Color

/** Горимоос үл хамаарах брэндийн ramp. */
val brand50 = Color(0xFFEEF5FF)
val brand100 = Color(0xFFD6E8FF)
val brand200 = Color(0xFFADCFFF)
val brand300 = Color(0xFF7BB0FF)
val brand400 = Color(0xFF3D8CF7)
val brand500 = Color(0xFF0064DF)
val brand600 = Color(0xFF0053BB)
val brand700 = Color(0xFF004296)
val brand800 = Color(0xFF083470)
val brand900 = Color(0xFF06214C)
val brand950 = Color(0xFF061827)
val bannerErrorBG = Color(0xFFFEE2E2)
val bannerErrorBorder = Color(0xFFFCA5A5)
val bannerErrorText = Color(0xFF7F1D1D)
val bannerErrorIcon = Color(0xFFB91C1C)
val bannerSuccessBG = Color(0xFFDCFCE7)
val bannerSuccessIcon = Color(0xFF16A34A)
val accentGold = Color(0xFFD4A017)
val warningBG = Color(0xFFFEF3C7)
val sidebarBackground = Color(0xFF061827)
val sidebarHover = Color(0xFF0F2E44)
val sidebarMutedText = Color(0xFF94A3B8)

/** Гэрэл/харанхуйд өөр өөр утгатай токенууд. */
data class EidColors(
    val eidAccent: Color,
    val eidAccentStrong: Color,
    val eidAccentSubtle: Color,
    val eidAccentMuted: Color,
    val eidSuccess: Color,
    val eidWarning: Color,
    val eidDanger: Color,
    val eidCardBackground: Color,
    val eidCardStroke: Color,
    val eidSurface: Color,
    val eidMuted: Color,
    val backgroundSecondary: Color,
    val textPrimary: Color,
)

val EidLightColors = EidColors(
    eidAccent = Color(0xFF0064DF),
    eidAccentStrong = Color(0xFF004296),
    eidAccentSubtle = Color(0xFFD6E8FF),
    eidAccentMuted = Color(0xFFEEF5FF),
    eidSuccess = Color(0xFF107C10),
    eidWarning = Color(0xFF9D5D00),
    eidDanger = Color(0xFFBA1A1A),
    eidCardBackground = Color(0xFFFFFFFF),
    eidCardStroke = Color(0xFFE5E7EB),
    eidSurface = Color(0xFFF4F7F8),
    eidMuted = Color(0xFF6B7280),
    backgroundSecondary = Color(0xFFF1F5F9),
    textPrimary = Color(0xFF0B2033),
)

val EidDarkColors = EidColors(
    eidAccent = Color(0xFF7BB0FF),
    eidAccentStrong = Color(0xFFADCFFF),
    eidAccentSubtle = Color(0xFF06214C),
    eidAccentMuted = Color(0xFF061827),
    eidSuccess = Color(0xFF6FCF6F),
    eidWarning = Color(0xFFE8B66A),
    eidDanger = Color(0xFFFFB4AB),
    eidCardBackground = Color(0xFF1F1F23),
    eidCardStroke = Color(0xFF34343A),
    eidSurface = Color(0xFF0B0E12),
    eidMuted = Color(0xFF9CA3AF),
    backgroundSecondary = Color(0xFF111827),
    textPrimary = Color(0xFFF8FAFC),
)
