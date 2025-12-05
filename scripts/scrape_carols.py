#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "httpx",
#     "beautifulsoup4",
# ]
# ///
"""Scrape Christmas carol lyrics from bookofcarols.com"""

import asyncio
import re
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://www.bookofcarols.com/"

PUBLIC_DOMAIN_CAROLS = {
    "a_boy_is_born_in_bethlehem",
    "a_christmas_carol",
    "a_day_a_day_of_glory",
    "a_great_and_mighty_wonder",
    "a_visit_from_saint_nicholas",
    "adeste_fideles",
    "all_my_heart_this_night_rejoices",
    "all_through_the_night",
    "angels_and_shepherds",
    "angels_from_the_realm_of_glory",
    "angels_we_have_heard_on_high",
    "as_lately_we_watched",
    "as_with_gladness_men_of_old",
    "auld_lang_syne",
    "ave_maria",
    "away_in_a_manger",
    "ben_jonsons_carol",
    "birthday_of_a_king",
    "break_forth_o_beauteous_heavenly_light",
    "brightest_and_best",
    "bring_a_torch_jeanette_isabella",
    "cantique_de_noel",
    "children_go_where_i_send_thee",
    "christ_is_born_in_bethlehem",
    "christians_awake_salute_the_happy_morn",
    "come_all_ye_shepherds",
    "come_ye_lofty",
    "cradled_in_a_manger_meanly",
    "deck_the_halls",
    "ding_dong_merrily_on_high",
    "earth_today_rejoices",
    "es_ist_ein_ros_entsprungen",
    "far_far_away_on_judeas_plains",
    "from_heaven_above_to_earth_i_come",
    "from_heaven_high_o_angels_come",
    "from_highest_heaven_i_come_to_tell",
    "from_the_eastern_mountains",
    "fum_fum_fum",
    "gentle_mary_laid_her_child",
    "give_heed_my_heart",
    "glory_be_to_god_on_high",
    "go_tell_it_on_the_mountain",
    "god_from_on_high_hath_heard",
    "god_is_love",
    "god_rest_ye_merry_gentlemen",
    "good_christian_men_rejoice",
    "good_king_wenceslas",
    "hark_the_herald_angels_sing",
    "he_smiles_within_his_cradle",
    "here_is_joy_for_every_age",
    "here_we_come_a-wassailing_the_wassail_song",
    "hymn_for_christmas_day",
    "i_heard_the_bells_on_christmas_day",
    "i_saw_three_ships",
    "i_wonder_as_i_wander",
    "il_est_ne_le_divin_enfant",
    "in_excelsis_gloria",
    "it_came_upon_the_midnight_clear",
    "jingle_bells",
    "jolly_old_saint_nicholas",
    "joseph_dearest_joseph_mine",
    "joy_to_the_world",
    "let_earth_and_heaven_combine",
    "lo_he_comes_with_clouds_descending",
    "lo_how_a_rose_eer_blooming",
    "love_came_down_at_christmas",
    "maker_of_the_sun_and_moon",
    "no_crowded_eastern_street",
    "now_the_bells_ring",
    "o_christmas_tree",
    "o_come_little_children",
    "o_come_all_ye_faithful",
    "o_come_o_come_emmanuel",
    "o_holy_night",
    "o_little_town_of_bethlehem",
    "o_remember_adams_fall",
    "o_tannenbaum",
    "once_in_royal_davids_city",
    "over_the_river_and_through_the_woods",
    "pat-a-pan",
    "praise_the_saviour_all_ye_nations",
    "see_amid_the_winters_snow",
    "silent_night",
    "sing_we_noel",
    "star_of_the_east",
    "still_still_still",
    "stille_nacht",
    "sweet_little_jesus_boy",
    "the_angels_song",
    "the_coventry_carol",
    "the_first_noel",
    "the_friendly_beasts",
    "the_gloucestershire_wassail",
    "the_holly_and_the_ivy",
    "the_huron_carol_twas_in_the_moon_of_winter_time",
    "the_manger_throne",
    "the_night_before_christmas",
    "the_race_that_long_in_darkness_pined",
    "the_shepherds_carol",
    "the_snow_lay_on_the_ground",
    "the_twelve_days_of_christmas",
    "to_us_a_child_of_royal_birth",
    "toyland",
    "un_flambeau",
    "unto_us_a_boy_is_born",
    "up_on_the_housetop",
    "we_three_kings_of_orient_are",
    "we_wish_you_a_merry_christmas",
    "what_child_is_this",
    "when_joseph_went_to_bethlehem",
    "while_by_my_sheep_i_watched_at_night",
    "while_shepherds_watched_their_flocks",
    "with_wondering_awe",
}


async def get_carol_urls(client: httpx.AsyncClient) -> list[tuple[str, str]]:
    """Fetch the main page and extract all carol URLs."""
    response = await client.get(BASE_URL)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    carols = []

    for link in soup.find_all("a"):
        href = link.get("href", "")
        if href.endswith(".html") and "/" in href:
            carol_id = href.rsplit("/", 1)[-1].replace(".html", "")
            if carol_id in PUBLIC_DOMAIN_CAROLS:
                title = link.get_text(strip=True)
                full_url = urljoin(BASE_URL, href)
                carols.append((title, full_url))

    return carols


def parse_lyrics(html: str) -> tuple[str, str]:
    """Parse title and lyrics from HTML."""
    soup = BeautifulSoup(html, "html.parser")

    title_elem = soup.find(id="carol_title")
    title = title_elem.get_text(strip=True) if title_elem else "Unknown"

    lyrics_elem = soup.find(id="carol_lyrics")
    if not lyrics_elem:
        return title, ""

    html_content = str(lyrics_elem)
    text = html_content.replace("<br/>", "\n").replace("<br>", "\n")
    text = re.sub(r"<[^>]+>", "", text)
    lines = [line.strip() for line in text.split("\n")]
    cleaned_lines = []
    prev_blank = False
    for line in lines:
        if not line:
            if not prev_blank:
                cleaned_lines.append("")
                prev_blank = True
        else:
            cleaned_lines.append(line)
            prev_blank = False

    while cleaned_lines and not cleaned_lines[0]:
        cleaned_lines.pop(0)
    while cleaned_lines and not cleaned_lines[-1]:
        cleaned_lines.pop()

    return title, "\n".join(cleaned_lines)


async def fetch_carol(
    client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore
) -> tuple[str, str] | None:
    """Fetch a single carol's lyrics."""
    async with semaphore:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return parse_lyrics(response.text)
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None


async def main():
    print("Fetching carol list...")

    async with httpx.AsyncClient(timeout=30) as client:
        carols = await get_carol_urls(client)
        print(f"Found {len(carols)} public domain carols")

        semaphore = asyncio.Semaphore(10)
        tasks = [fetch_carol(client, url, semaphore) for _, url in carols]
        results = await asyncio.gather(*tasks)

    all_lyrics = []
    for result in results:
        if result:
            title, lyrics = result
            if lyrics:
                all_lyrics.append(f"{title.upper()}\n\n{lyrics}")

    output_file = "carol-lyrics.txt"
    with open(output_file, "w") as f:
        f.write("\n\n".join(all_lyrics))

    print(f"Wrote {len(all_lyrics)} carols to {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
