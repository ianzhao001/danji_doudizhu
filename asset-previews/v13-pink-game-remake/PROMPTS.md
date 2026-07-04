# v13 pink game remake image_gen prompts

目标：保持现有 pink 粉色卡通风格，只借鉴用户参考截图的布局与元素层级，不复刻第三方 IP、logo、角色或图标。

## Pipeline Ruling

- `source/ai-direction-sheet.png` is the user-approved direction reference.
- Existing `*-preview.png`, `review-sheet.png`, and `composites/composite-*.png` are **layout mockup only / 非正式资产** from the older Pillow pass.
- Formal `*-v13.png` assets in this package are derived from built-in `image_gen` source images under `source/generated-v13/`.
- Pillow is used only for non-creative post-processing: crop, chroma-key removal, resize, 9-slice stretch simulation, review-sheet/composite layout, and sha256 calculation.
- User feedback fix 2026-07-05: bidding/playing/settlement composites were rejected because characters overlapped, the three body sizes were inconsistent, and the hero appeared on the tabletop instead of beside the hand. Composite zones now mirror T-LAYOUT3 fix `927b375`, use equal body rectangles, and keep the hero left of `heroHandLarge`; no image_gen source was regenerated.

## Built-in image_gen source prompts

### `source/generated-v13/game-table-bg-v13-source.png`

Prompt summary: original sweet pink cartoon landscape game table background; large oval table; no characters, no cards, no UI buttons, no logo, no readable text.

### `source/generated-v13/avatars-v13-source.png`

Prompt summary: three original cute cartoon female player body sprites on flat #00ff00 chroma-key background; no labels, no logo, no third-party IP.

### `source/generated-v13/ui-v13-source.png`

Prompt summary: 4x3 text-free pink cartoon UI sprite sheet on flat #00ff00 chroma-key background: nameplate, buttons, settlement ribbons/panel, dock, timer/multiplier/role badges.

### `source/generated-v13/cards-v13-source.png`

Prompt summary: text-free pink cartoon card sprite sheet on flat #00ff00 chroma-key background: card template, back, suits, Joker skins.

## Formal generated files

- `source/generated-v13/avatars-v13-source.png` sha256 `c562ec6db7b0754f8aed6f11dfeee2412d116813bc4d5846a249cc48a793a6aa` size `1774x887` alpha `False` transparentCorners `False` userReview `waiting`
- `source/generated-v13/cards-v13-source.png` sha256 `adfb127a6d433e1e0873fb36f8af7ddd13e4bec74e11e66e6cb023063414e221` size `1448x1086` alpha `False` transparentCorners `False` userReview `waiting`
- `source/generated-v13/game-table-bg-v13-source.png` sha256 `310b2148d253abc8f758dd131052ebd03a6f37d687ee70dfe44edb2643ad408c` size `1846x852` alpha `False` transparentCorners `False` userReview `waiting`
- `source/generated-v13/ui-v13-source.png` sha256 `a94d2a26830bed8eff6be5cf7d17413a284e387835ff063c332133ab434b179c` size `1536x1024` alpha `False` transparentCorners `False` userReview `waiting`
- `backgrounds/game-table-bg-v13.png` sha256 `fc8278caddd316f765d5f8265b928c1542b675f551d80faff06a057c2796a949` size `1688x780` alpha `False` transparentCorners `False` userReview `waiting`
- `avatars/hero-body-v13.png` sha256 `f2cf7b839ccf0a56b5c0ced95865e0c9654d2e44668e2744f78cce978fec03c5` size `320x360` alpha `True` transparentCorners `True` userReview `waiting`
- `avatars/left-ai-body-v13.png` sha256 `87d139fe18034eb3cf56ac85b5f8fc5229a98c0a895c3e2e3460bf4e1cf981f7` size `360x520` alpha `True` transparentCorners `True` userReview `waiting`
- `avatars/right-ai-body-v13.png` sha256 `bb3a197ed1baf6896e614236e15f51a2560cf66ae2ddf75ad3dcf8ec8332ff13` size `360x520` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/badge-multiplier-v13.png` sha256 `e31db64b06626c56be174ef353cdb2a6c67de1d75b6e686a658f3f2d4d108501` size `180x180` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/badge-role-v13.png` sha256 `256b5c4c6a05614c404dcd9577a29499bd33e5f01ffe1cc0fcd563f6fbf9d262` size `180x180` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/badge-timer-v13.png` sha256 `e4e3b36b27271b49946045b1ed9c8a356162297f7dc5d2c523c3131b852ab31d` size `180x180` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/bottom-cards-dock-v13.png` sha256 `ae5e9cf2e9a124331ea9f00948e44976380e81fb70096657d76e1447ea2d0a08` size `440x140` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/btn-disabled-v13.png` sha256 `ee859ef5bd84d724220093429480cf0c815ad6ec31036d77b366a2ea4f753342` size `480x160` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/btn-primary-v13.png` sha256 `5fd35d740d5e44d1130aec19d1ff3571cd60c2d394d373f107402b65b9c78952` size `480x160` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/btn-secondary-v13.png` sha256 `fd8e4989d0b3c7fc9d7497653db40fa4f28c71a8b9d5a166e69d5df10ca8c269` size `480x160` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/btn-tertiary-v13.png` sha256 `4f66efeb4430da48bd31e6aa6a59b4a4acacfadb2ea9432ad03509f4349c0e54` size `480x160` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/seat-nameplate-v13.png` sha256 `439301a5435380d6ebdc7a87474b72e4beaa250227dd89ecd6033f0ca8cee1c1` size `360x96` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/settlement-banner-lose-v13.png` sha256 `e9f51f5bc7e7c15a45e4fb04ddbc60ae4c646f3ec9fd6f1173c91e7b3ffa3eaa` size `640x180` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/settlement-banner-win-v13.png` sha256 `f0c234fc697e6b0f7128ce9e93e1e0e8eb90426fb1253e122165e2128413d296` size `640x180` alpha `True` transparentCorners `True` userReview `waiting`
- `ui/settlement-panel-v13.png` sha256 `4face92eebd2a792a87521b46cbf567c031550d9d91a096150c86d9e96002974` size `760x380` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/card-back-v13.png` sha256 `30768ee5b3994c8755e39cf9a434a4084af3b3f529fbe5a7bb944dcd35fbf4d4` size `220x320` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/card-template-v13.png` sha256 `45d9aecc40e1d65e8b5e9199f9f69edc66d0cf2de4635846ac566f9f993692f2` size `220x320` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/joker-big-v13.png` sha256 `4b635fac10d47c2d34067fd02f9f81c3deac3655edd3f2f32962a83443683230` size `220x320` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/joker-small-v13.png` sha256 `3e15df7fc116269319d61e633e56863d9cd53b423644e8db1a8c3d4cab9066d8` size `220x320` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/suit-club-v13.png` sha256 `4a80a76d6c98aff99ecb40a86cd6ddcd2f5f0988fb0127b0d7d6c8750ea01f59` size `128x128` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/suit-diamond-v13.png` sha256 `4df5921f0fc127f2578f1862791a7297a1513ed1539f8cdcba23f0233d259edb` size `128x128` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/suit-heart-v13.png` sha256 `0af62567b214f7621d511cb0afd351b303e891c72fb687706e9d2c4686f3bcd2` size `128x128` alpha `True` transparentCorners `True` userReview `waiting`
- `cards/suit-spade-v13.png` sha256 `f1fb7153001e6ba63de04c3e0ada096aca722004ee25d04d5b6a722b2a167a53` size `128x128` alpha `True` transparentCorners `True` userReview `waiting`
- `stretch-simulations/bottom-cards-dock-v13-stretch.png` sha256 `3bd292f40d06e8488e5a01fcc2ae9e34e5bbd19cbfafd6f059731f5a81c969c6` size `300x220` alpha `False` transparentCorners `False` userReview `waiting`
- `stretch-simulations/btn-disabled-v13-stretch.png` sha256 `fab09cc7651ed91f920735fe22e4cf32b8bc8416e312e779afe9780b8eb22450` size `300x220` alpha `False` transparentCorners `False` userReview `waiting`
- `stretch-simulations/btn-primary-v13-stretch.png` sha256 `f855525526514105706aa0d0be5263f54cd76b9ebb61829fc38efc724edf5e35` size `300x220` alpha `False` transparentCorners `False` userReview `waiting`
- `stretch-simulations/btn-secondary-v13-stretch.png` sha256 `d8c7e6e9188b5862dc94ee94c06ba2a343a67f4773ba72e3dd302909a7328e72` size `300x220` alpha `False` transparentCorners `False` userReview `waiting`
- `stretch-simulations/btn-tertiary-v13-stretch.png` sha256 `ec216cb0bcbdb64345508596951fcf83f63b67dfbf66832d262e19b87bc8ad76` size `300x220` alpha `False` transparentCorners `False` userReview `waiting`
- `stretch-simulations/seat-nameplate-v13-stretch.png` sha256 `365f5a37683585fb937a8726d9a430a7786e90b0758cc81f3ef781937921feaa` size `300x220` alpha `False` transparentCorners `False` userReview `waiting`
- `stretch-simulations/settlement-panel-v13-stretch.png` sha256 `3a5e47dee7d2e67905938e5ec9f5d64c9fa7e3c432bb596221806070d82dd650` size `300x440` alpha `False` transparentCorners `False` userReview `waiting`
- `composites/v13/composite-780x360-playing-v13.png` sha256 `35f31c6a455785da3c015a1d7af232237f4980ae1b116c6b858e5d113eb094e9` size `780x360` alpha `False` transparentCorners `False` userReview `waiting`
- `composites/v13/composite-844x390-bidding-v13.png` sha256 `7f6d951c84e66c1e9bbcb13a47b31b6643848e5d3a937850cf37c5e731eb5db1` size `844x390` alpha `False` transparentCorners `False` userReview `waiting`
- `composites/v13/composite-844x390-settlement-v13.png` sha256 `0d5f3809d9dffde0bddb8881883a6b4ffb32fe5956868b424e9a8391eaccb6b9` size `844x390` alpha `False` transparentCorners `False` userReview `waiting`
- `review-sheet-v2.png` sha256 `c78907d97ba47e847b820a158666a2e598b2ece95fc638c9a556a4836c23f71d` size `1800x1320` alpha `False` transparentCorners `False` userReview `waiting`
