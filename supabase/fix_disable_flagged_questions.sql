-- fix_disable_flagged_questions.sql
-- Sets is_active = false on every question flagged by the LLM
-- comprehensive quality-review pass (curriculum, distractor,
-- image, comprehension issues). Questions remain in the DB
-- so they can be reviewed + re-enabled later.
--
-- 105 questions disabled. After running, the active
-- pool drops from 704 to ~599 questions.
--
-- Run in Supabase SQL Editor.

BEGIN;

UPDATE assessment_questions
SET is_active = false
WHERE id IN (
  '1dac7d8d-13c7-4372-b8ea-9d2014998c0e', -- curriculum_alignment:concept_not_in_unit
  'e97e01b6-35f7-4b0c-a84d-75feb91e5e42', -- curriculum_alignment:concept_not_in_unit
  '21060cb5-b697-4382-81f8-38fd748b3613', -- curriculum_alignment:concept_not_in_unit
  '3782ae84-ed2e-404f-9ab1-34f795501c4b', -- curriculum_alignment:concept_not_in_unit
  '83c80218-841f-4498-a965-965ea5758ff7', -- curriculum_alignment:concept_not_in_unit
  'ce81bd81-be69-48f5-8257-8f1b3024124f', -- curriculum_alignment:concept_not_in_unit
  'cedb5b19-99ca-49ad-839c-ab9d4b642ab2', -- curriculum_alignment:concept_not_in_unit
  'bf6c1d3c-12a4-46b0-b751-ea8e8d1a7f3b', -- curriculum_alignment:concept_not_in_unit
  '5d1c9e19-08b9-4ac8-823e-7ef20e98f82f', -- curriculum_alignment:concept_not_in_unit
  '7067bce3-2bbd-45cf-b9e1-c6f9df5336c2', -- curriculum_alignment:concept_not_in_unit
  '7ef67c07-ac6e-4f41-9171-c32f6223e43f', -- curriculum_alignment:concept_not_in_unit
  'e1ccd9b5-3e96-4624-b182-226d2680c3a6', -- curriculum_alignment:concept_not_in_unit
  '98167a44-72e3-4c50-a1b7-d589e650043b', -- curriculum_alignment:concept_not_in_unit
  '380d69b2-d5c8-424d-a472-63bc9ece478c', -- curriculum_alignment:concept_not_in_unit
  '89f3f005-5074-40b6-b4c4-594c0d623444', -- curriculum_alignment:concept_not_in_unit
  'd5b4c718-83f8-4aa4-8ae5-47995af3f04f', -- curriculum_alignment:concept_not_in_unit
  'eec5fa07-03b6-434e-91c7-4b9c3790d700', -- curriculum_alignment:concept_not_in_unit
  '52483989-2fe0-4a70-b03a-1dca64fa2c57', -- curriculum_alignment:concept_not_in_unit
  '1b7d0110-3a10-4444-8a4a-62b41d3d06e5', -- curriculum_alignment:concept_not_in_unit
  '92a294eb-9893-4cc6-8632-f827e1d20792', -- curriculum_alignment:concept_not_in_unit
  'ec8cc104-d12e-4c76-8746-ba21a82d6ee1', -- curriculum_alignment:concept_not_in_unit
  '8ef7ccdb-a9d1-4710-b6ac-1710b07f9e3e', -- curriculum_alignment:concept_not_in_unit
  'daa9c194-07fa-4465-965f-54d4c47e7474', -- curriculum_alignment:concept_not_in_unit
  '4355aa3d-de1d-4c51-b527-0f710bad05aa', -- curriculum_alignment:concept_not_in_unit
  '53b5e47e-788e-4c78-90ea-e72cdbd57742', -- curriculum_alignment:concept_not_in_unit
  '37dbd18c-a2a1-4f1c-a01a-72aed97c6c56', -- curriculum_alignment:concept_not_in_unit
  '304f20c9-c6ae-45e5-8564-1b274694cd4b', -- curriculum_alignment:concept_not_in_unit
  '0227ac90-c7f7-429d-b22f-b1571f4f3d10', -- curriculum_alignment:concept_not_in_unit
  'b2cab0a5-fa96-46f5-a30f-80c003bd60a7', -- curriculum_alignment:concept_not_in_unit
  '3e3be8d4-92a0-4314-a0b1-521c88eddac4', -- curriculum_alignment:concept_not_in_unit
  '3a76049c-f765-4860-8c86-9b1ef8b96791', -- curriculum_alignment:concept_not_in_unit
  '377fe7a1-d488-4ac8-bea4-07591f516259', -- curriculum_alignment:concept_not_in_unit
  '1886bc7d-e1c4-450b-850e-dbd05b12528a', -- curriculum_alignment:concept_not_in_unit
  '75e7bd18-0a2f-4aa4-ba5c-f4a7ec696407', -- curriculum_alignment:concept_not_in_unit
  'd77c9ad8-eb1e-420d-b2a7-c4684f449bae', -- curriculum_alignment:concept_not_in_unit
  'b9fbcb9b-0b5e-4070-9ad3-67df67ed5a63', -- curriculum_alignment:concept_not_in_unit
  '04545925-4f15-4861-9a61-798558212394', -- curriculum_alignment:concept_not_in_unit
  '87c094cb-e88d-4190-9274-b983943a6fb9', -- curriculum_alignment:concept_not_in_unit
  '61d1c3d9-ea83-4b42-8a97-3c56f2ef3a60', -- curriculum_alignment:concept_not_in_unit
  'f765f609-afc5-4983-8e92-871c8768a93a', -- curriculum_alignment:concept_not_in_unit
  'b019d1e5-8699-477d-a8b8-6ef51d0ca13a', -- curriculum_alignment:advanced_for_unit
  'e75be4b9-54f5-4e34-9684-1e7276bbd116', -- curriculum_alignment:concept_not_in_unit
  'b801b8d9-63ff-4dd5-9d80-779b995b9411', -- curriculum_alignment:wrong_topic
  '10f8e2c9-6b32-4d17-ade4-7f8ad9b5387c', -- curriculum_alignment:wrong_topic
  '47150802-5185-4439-97c7-a87963735b18', -- curriculum_alignment:wrong_topic
  'b0365940-5905-420b-8918-7323147d41f0', -- curriculum_alignment:topic_lesson_15_mismatch
  '1bec063a-bd03-4e3b-9844-e7ecd221ed56', -- curriculum_alignment:topic_lesson_15_mismatch
  '04015fc8-15ea-4486-9a66-dfc573ae237b', -- comprehension:info_overload
  '3b47c2e5-7583-448b-a23b-1e72739ffca9', -- distractor_quality:distractor_ambiguous
  '3f666519-1792-42c4-937e-321ce4f34a64', -- curriculum_alignment:topic_mismatch
  'e95803f5-59f3-4c27-a67a-896665f79f42', -- curriculum_alignment:topic_mismatch
  '4a61e810-a281-4765-abcd-c753627bf798', -- comprehension:ambiguous_wording
  '82ec74e7-5094-439a-b683-29125550a3f7', -- comprehension:ambiguous_wording
  '6a068db5-43ea-4787-877c-be61329e62ac', -- comprehension:ambiguous_wording
  'b0b06a26-6f10-4312-a263-e8e49993dc04', -- comprehension:vocab_too_advanced
  '9654aeaf-30dd-4cea-aa9c-bcf203f9c486', -- curriculum_alignment:concept_not_in_unit
  'caa561e8-76f2-465e-9341-ad365bbc7a55', -- comprehension:implicit_quantity_unintroduced
  '20758c1c-b8cb-4037-a91c-bf6e7cfc13c4', -- comprehension:implicit_quantity_unintroduced
  'da9af35c-00cf-4d7b-bf33-0597267693c0', -- comprehension:needs_prior_question
  '135bfbcc-26dc-486e-99aa-86d7639b2ec3', -- comprehension:ambiguous_wording
  'a9aca3bd-3f06-4c11-b589-ec821c351515', -- distractor_quality:topic_mixes_unit
  '7d8dfccf-12e3-42c5-877f-e8ad1cd3e180', -- image_integrity:image_alt_too_vague
  '27f4cc11-5eb6-4220-98b0-b766533df307', -- comprehension:needs_prior_question
  '814f54b6-24de-4ea9-8b19-d50dc4b8b835', -- image_integrity:image_alt_too_vague
  '11c17ec3-d431-49ba-82f0-2206795262ff', -- image_integrity:image_alt_too_vague
  '9fdddf6b-262e-4991-83d6-18af7cf8df8b', -- image_integrity:image_alt_too_vague
  'd94dbd12-4000-402a-a901-d658d6394408', -- image_integrity:image_alt_too_vague
  '91fa208a-0a72-4fb3-8b6f-861caeb79d81', -- image_integrity:image_alt_too_vague
  'fa6d69e0-375d-43ef-9cd7-a42e149f145b', -- distractor_quality:answer_logic_problematic
  'ab16f007-a305-43a4-ba06-8a204fd0b251', -- comprehension:needs_prior_question
  'b1a1bb03-283b-40ca-a28c-5f6ccb299f6c', -- comprehension:needs_prior_question
  '24dc8f31-5546-4531-ae93-21d51420560f', -- comprehension:info_repeated_inline
  'a220ebce-5f25-4ebe-90a5-d2a3e269595c', -- comprehension:info_repeated_inline
  'ccf8a8db-a5ff-476d-a41f-caafa661da6c', -- comprehension:info_repeated_inline
  '329f2b59-884e-4a86-aa04-15de4c03fcea', -- comprehension:info_repeated_inline
  '660ebfea-22dc-49dc-bbf3-95f477e1a259', -- comprehension:info_count_mismatch
  '9d028b22-5d38-4011-a915-f28919bf158a', -- distractor_quality:one_distractor_invalid
  'ea05ac41-92ae-4524-86e1-04180e06573b', -- curriculum_alignment:concept_not_in_unit
  '6b17d275-2242-45cb-92ff-96d9aba0e620', -- curriculum_alignment:topic_lesson_mismatch
  '89317409-246e-4c3c-9b33-e7023750fee4', -- curriculum_alignment:topic_lesson_mismatch
  'd7701432-20b9-448e-8116-b37498cca8b5', -- curriculum_alignment:concept_not_in_unit
  'a66d7362-bb97-4879-840f-cd662913cfc3', -- distractor_quality:distractors_mostly_irrelevant
  '604c8c60-ed37-44d9-aef6-605610afa3e2', -- distractor_quality:answer_potentially_misread
  'aeb8abbf-b013-497b-8e02-1e88bd22a8b8', -- curriculum_alignment:wrong_topic
  '2fc5b8db-a497-41fe-bc7f-e8c4d4f749e3', -- comprehension:implicit_total
  '422f8d8d-7c55-415e-a91b-adf433d54a7a', -- curriculum_alignment:concept_not_in_unit
  'a4d3b966-6991-4b19-8a4c-b8c0b53d2b4b', -- curriculum_alignment:concept_not_in_unit
  'a0b638ba-340d-4d9c-97bc-eb1756b8be7f', -- curriculum_alignment:concept_not_in_unit
  'de6832d5-6a69-4482-a733-b85917cd1a7f', -- curriculum_alignment:concept_not_in_unit
  '43b44313-ba87-4494-9a4c-8fa01f71fa8e', -- curriculum_alignment:concept_not_in_unit
  'ad6f309a-b0dd-49b5-b3a5-fa1cd9b13a93', -- curriculum_alignment:concept_not_in_unit
  '3cfc936d-3600-4a42-aeee-4b101b17ddae', -- curriculum_alignment:concept_not_in_unit
  '60fbbc75-6ffd-4d23-8faf-cfde6fc53517', -- curriculum_alignment:concept_not_in_unit
  '5cc05c56-c471-422b-91fc-23df8b5deeec', -- curriculum_alignment:concept_not_in_unit
  '36b9afb3-ac0f-4e11-9910-73cd6929b5f9', -- curriculum_alignment:concept_not_in_unit
  '3c7fbf76-9092-4a0c-89e4-b02aca48daea', -- curriculum_alignment:concept_not_in_unit
  'db0bc96a-a17a-43cd-9e14-219e5cdafedc', -- curriculum_alignment:concept_not_in_unit
  '42a53d24-555d-48e3-bd96-b1089fb9733c', -- curriculum_alignment:concept_not_in_unit
  'b62c3399-5631-4989-88bd-94d751991731', -- distractor_quality:answer_too_obvious
  '7e262a14-5f72-433c-bc2d-fc589f6e01d5', -- comprehension:uncommon_term
  '5275391e-385d-4f84-ac30-d9c42aef882e', -- comprehension:ambiguous_wording
  '03d4aa2c-1f1c-4b57-95b4-f9b2660d542a', -- distractor_quality:unrealistic_choice
  '68b9392f-ed72-42d3-a4e9-de9669407eb8', -- distractor_quality:inconsistent_with_other
  '0fd2dcff-ba04-41ce-8815-f7ec9887e784', -- image_integrity:image_alt_too_vague
  'ff70276a-ff36-4347-8074-ec191d55c6da'  -- comprehension:implicit_calculation
);

COMMIT;

-- Revert: set is_active = true on the same UUIDs above.
