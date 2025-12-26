export async function getFlag(countryName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${countryName}?fullText=true&fields=flags`
    );

    // If exact match fails → fallback to first search match
    if (!res.ok) {
      const fallback = await fetch(
        `https://restcountries.com/v3.1/name/${countryName}?fields=flags`
      );
      const fb = await fallback.json();
      return fb?.[0]?.flags?.png || null;
    }

    const data = await res.json();
    return data?.[0]?.flags?.png || null;
  } catch {
    return null;
  }
}
