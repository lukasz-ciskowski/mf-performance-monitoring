
# Przykłady zastosowań procesów oceny metryk, logów i tracingu

## 1. Przykłady zastosowania dla metryk systemowych

- **Monitorowanie CPU**: W środowisku testowym mikroserwis `kafka-receiver-a` zużywał znaczną część zasobów procesora przy obsłudze zdarzeń. Analiza tej metryki pozwoliła wskazać potrzebę skalowania poziomego.
- **Monitorowanie pamięci RAM**: W serwisie `db-service` zauważono stopniowy wzrost zużycia pamięci przy długotrwałym obciążeniu. Wynik ten wskazywał na możliwy wyciek pamięci.
- **Obciążenie I/O**: Analiza zapytań do `postgres-service` wykazała opóźnienia wynikające z intensywnego odczytu dysku, co wpłynęło na czas odpowiedzi aplikacji.
- **Dostępność usług (health check)**: Podczas testów `file-service` wielokrotnie nie odpowiadał kodem 200, co pozwoliło zweryfikować poprawność działania mechanizmów alertowania.
- **Obciążenie CPU per service**: Porównanie `kafka-receiver-a` i `kafka-receiver-b` pokazało różnice w obciążeniu wynikające z nierównomiernego rozdzielania komunikatów.

---

## 2. Przykłady zastosowania dla metryk aplikacyjnych / frontendowych

- **Czas odpowiedzi API**: Analiza wykazała, że średni czas odpowiedzi API w `db-service` wynosił <200 ms, ale w godzinach szczytu wzrastał do 700 ms.
- **Błędy HTTP (4xx, 5xx)**: W serwisie `auth` 1% wszystkich zapytań kończyło się błędem 500, co zostało powiązane z problemem w integracji z `postgres-service`.
- **Liczba requestów / throughput**: `db-service` obsługiwał średnio 200 req/s, a w momentach szczytowych 400 req/s, co pozwoliło na przetestowanie mechanizmów skalowania.
- **Frontend performance metrics**: Dla `spa-react` czas LCP przekraczał 2,5 s przy pierwszym renderze, co wskazywało na potrzebę optymalizacji ładowania zasobów.
- **Dostępność mikrofrontendów**: W przypadku `mf-remote-ui` odnotowano 2% przypadków, w których moduł nie załadował się poprawnie w `mf-spa-react`, co pozwoliło zweryfikować działanie fallbacków.

---

## 3. Przykłady zastosowania dla logów

- **Analiza błędów**: W logach `orders-service` pojawiał się błąd `NullPointerException`, którego korelacja z trace’ami wykazała problem w warstwie integracji z `mongo-service`.
- **Analiza wzorców zachowań**: W `kafka-receiver-b` pojawiały się liczne retry, co wskazywało na niestabilne połączenie z brokerem Kafka.
- **Korelacja logów z metrykami**: Wzrost latency wykryty w Prometheus został powiązany z logami błędów w `db-service` w tym samym przedziale czasowym.
- **Alertowanie na podstawie logów**: Zdefiniowano regułę w Grafanie, która wysyłała alert, gdy w ciągu 1 minuty w `auth-service` pojawiło się >5 błędów 500.
- **Śledzenie przepływu zdarzeń**: Analiza logów Kafka pozwoliła odtworzyć pełen przepływ komunikatów pomiędzy `kafka-service` a odbiorcami.

---

## 4. Przykłady zastosowania dla tracingu

- **Identyfikacja opóźnień (latency)**: Trace’y wykazały, że zapytania do `postgres-service` zajmują 60% całkowitego czasu odpowiedzi.
- **Analiza błędów (error analysis)**: Dzięki trace’om określono, że większość błędów 500 pochodzi z serwisu `payments`.
- **Analiza zależności usług**: Trace’y ujawniły sekwencję wywołań: `frontend` → `auth` → `orders` → `database`.
- **Śledzenie ścieżki użytkownika**: Powiązano kliknięcie w interfejsie `mf-remote-ui` z całym łańcuchem wywołań backendowych.
- **Porównanie percentyli czasu**: Obliczono, że 95% żądań wykonywane jest poniżej 200 ms, ale 1% przekracza 5 sekund.
- **Wykrywanie anomalii**: Zauważono pojawienie się dodatkowych wywołań do `cache-service`, które nie występowały w normalnym scenariuszu.
- **Korelacja z logami/metrykami**: Trace ID pozwolił szybko odnaleźć odpowiadający log błędu w `orders-service`.
- **Ocena dostępności usług**: Brak trace’ów z `inventory-service` wskazał na jego niedostępność.

---
