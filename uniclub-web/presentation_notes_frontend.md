# Frontend Presentation Notes

## Why React Query Instead of useEffect?

React Query secimi, manuel useEffect + local state yonetiminden daha guvenli ve olceklenebilir bir veri akisi saglar:

- Cache sayesinde ayni endpoint tekrar tekrar gereksiz cagrilmaz.
- Stale-while-revalidate davranisi ile eski veri gorunurken arka planda yenisi cekilir.
- Mutation sonrasinda query invalidation ile ekranlar otomatik senkron kalir.

## Why React Hook Form + Zod?

Bu ikili, backend'e gitmeden once form verisini dogrular:

- Bos isim, gecersiz email, hatali tarih gibi problemler istemci tarafinda yakalanir.
- Backend'den 409/422 donse bile form acik kalir, kullanici veriyi duzeltebilir.

## Axios Interceptor Value

Axios interceptor merkezi bir hata kanali olusturur:

- 400, 404, 409, 422 durumlarinda tek noktadan toast mesaji gosterilir.
- Sayfalarda tekrar eden try/catch boilerplate'i azalir.

## Suggested Live Demo Flow

1. Dashboard ac: anlik metrikleri ve capacity pulse bolumunu goster.
2. Clubs sayfasinda arama + filtre + pagination kullan.
3. "Create Club" ile validasyonlu form goster.
4. Events sayfasinda status filtresi ve badge yapisini anlat.
5. Event detail'de registration kisitlarini (Completed/Canceled disable) canli goster.
6. Footer health indicator ile backend baglantisini vurgula.

## Resilience Highlights

- ErrorBoundary sayesinde kritik render hatasinda beyaz ekran yerine kontrollu fallback UI.
- Skeleton + empty state ile veri yokken veya gec gelirken kullanici deneyimi bozulmaz.
- Query invalidation ile olusturma islemleri sonrasinda manuel refresh gerekmez.
