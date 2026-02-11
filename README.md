# Əl Hərəkəti ilə İdarə Olunan Particle Effekti

Real vaxt rejimində *kamera vasitəsilə əl hərəkətini izləyərək* particle-lardan (zərrəciklərdən) ibarət mətn və ya forma yaradan interaktiv veb layihə.

🔗 *Demo:* https://naill-dev.github.io/aihandtracking/

## Nə edir?
- Brauzerdə kameranı işə salır və əlinizi izləyir (MediaPipe HandLandmarker ilə)
- Şəhadət barmağınızın ucu particle-ları itələyir və ya cəlb edir
- İstənilən mətni particle-lardan yaradır (məsələn adınız, "Salam Dünya", "Nail" və s.)
- Mətn boş qoyulanda sferik (sphere) formada particle buludu yaranır
- Yumşaq hərəkət effekti + trail (iz) effekti ilə real vaxt animasiyası

## Texnologiyalar
- HTML5 Canvas + JavaScript
- MediaPipe Tasks Vision (HandLandmarker) – əl landmarklarını aşkar etmək
- getUserMedia API – brauzerdə kamera axını
- ES Modules + async/await

## Necə işlədirəm?
1. Səhifəni açın  
2. Kameraya icazə verin  
3. Əlinizi göstərin (şəhadət barmağınızı irəli tutun)  
4. Aşağıdakı input-a mətn yazın və "Yarat" düyməsinə basın  
5. Əlinizlə particle-ları idarə edin!

*Qeyd:* İlk yüklənmə 10–60 saniyə çəkə bilər (AI modeli endirilir). Sonrakı dəfələr 2–5 saniyəyə düşür.

## Gələcək planlar
- Bütün barmaqları və əl jestlərini izləmək
- Hərəkətə görə rəng dəyişmə effekti
- Bir neçə əl dəstəyi
- Mobil cihazlarda daha yaxşı performans

Xoşunuza gəldisə ★ ulduz basın, fork edin və ya paylaşın!  
Rəy və təkliflərinizi gözləyirəm ✋🔥



# Hand-Tracked Particle Effect

An interactive web project that tracks hand movements in real-time via webcam and animates particles to form text or shapes.

🔗 *Live Demo:* https://naill-dev.github.io/aihandtracking/

## What it does
- Opens your webcam and tracks your hand using MediaPipe HandLandmarker
- The tip of your index finger repels or attracts particles
- Type any text → it turns into particles (e.g. your name, "Hello World")
- If input is empty → creates a spherical particle cloud
- Smooth real-time animation with trail effect

## Technologies Used
- HTML5 Canvas + JavaScript
- MediaPipe Tasks Vision (HandLandmarker) – hand landmark detection
- getUserMedia API – browser webcam access
- ES Modules + async/await

## How to Use
1. Open the page  
2. Allow camera access  
3. Show your hand (hold index finger forward)  
4. Type text in the input and click "Create"  
5. Control the particles with your hand!

*Note:* First load may take 10–60 seconds (AI model download). Subsequent loads are fast (2–5 seconds).

## Future Plans
- Track all fingers and gestures
- Color-changing effect based on movement
- Multi-hand support
- Better mobile optimization

If you like it, give it a ★, fork it, or share!  
Feedback and suggestions are welcome ✋🔥
