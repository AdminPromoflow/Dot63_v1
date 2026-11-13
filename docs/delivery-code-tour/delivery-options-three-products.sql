-- Delivery options proposal for products 39, 281 and 287.
-- Source: u273173398_dot63-4.sql.
-- Run manually in the intended database. No schema changes or new records.
-- Updates only delivery fields; existing product prices remain unchanged.
-- Each legacy field mirrors the first option sorted by days.
-- Explicit IDs and product ownership guards limit the affected rows.
-- Re-running this script reapplies the same proposed configuration.

START TRANSACTION;

-- Super Lanyard: Flat (1 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":5,"value":"20","type":"percentage"},{"days":10,"value":"10","type":"percentage"},{"days":15,"value":"0","type":"amount"}]',
    v.delivery_time_days = 5,
    v.delivery_price = 20,
    v.delivery_price_type = 'percentage'
WHERE v.product_id = 39
  AND v.variation_id IN (634);

-- Super Lanyard: Tubular (1 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":10,"value":"15","type":"percentage"},{"days":15,"value":"0","type":"amount"}]',
    v.delivery_time_days = 10,
    v.delivery_price = 15,
    v.delivery_price_type = 'percentage'
WHERE v.product_id = 39
  AND v.variation_id IN (802);

-- Double-Ended: Flat (1 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":7,"value":"30","type":"amount"},{"days":12,"value":"15","type":"amount"},{"days":18,"value":"0","type":"amount"}]',
    v.delivery_time_days = 7,
    v.delivery_price = 30,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 281
  AND v.variation_id IN (2513);

-- Double-Ended: Tubular (1 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":12,"value":"20","type":"amount"},{"days":18,"value":"0","type":"amount"}]',
    v.delivery_time_days = 12,
    v.delivery_price = 20,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 281
  AND v.variation_id IN (2514);

-- Paper Bags: preserve existing Default options (1 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":15,"value":"25","type":"percentage"},{"days":20,"value":"0","type":"amount"}]',
    v.delivery_time_days = 15,
    v.delivery_price = 25,
    v.delivery_price_type = 'percentage'
WHERE v.product_id = 287
  AND v.variation_id IN (2589);

-- Paper Bags: No extra finish (18 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":15,"value":"0","type":"amount"},{"days":20,"value":"0","type":"amount"}]',
    v.delivery_time_days = 15,
    v.delivery_price = 0,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 287
  AND v.variation_id IN (2614, 2620, 2625, 2630, 2635, 2640, 2645, 2650, 2655, 2660, 2665, 2670, 2675, 2680, 2685, 2690, 2695, 2700);

-- Paper Bags: Gloss/matt lamination (18 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":15,"value":"15","type":"amount"},{"days":20,"value":"0","type":"amount"}]',
    v.delivery_time_days = 15,
    v.delivery_price = 15,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 287
  AND v.variation_id IN (2615, 2621, 2626, 2631, 2636, 2641, 2646, 2651, 2656, 2661, 2666, 2671, 2676, 2681, 2686, 2691, 2696, 2701);

-- Paper Bags: Soft-touch lamination (18 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":15,"value":"25","type":"amount"},{"days":20,"value":"0","type":"amount"}]',
    v.delivery_time_days = 15,
    v.delivery_price = 25,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 287
  AND v.variation_id IN (2618, 2622, 2627, 2632, 2637, 2642, 2647, 2652, 2657, 2662, 2667, 2672, 2677, 2682, 2687, 2692, 2697, 2702);

-- Paper Bags: Hot foil (18 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":20,"value":"20","type":"amount"}]',
    v.delivery_time_days = 20,
    v.delivery_price = 20,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 287
  AND v.variation_id IN (2619, 2623, 2628, 2633, 2638, 2643, 2648, 2653, 2658, 2663, 2668, 2673, 2678, 2683, 2688, 2693, 2698, 2703);

-- Paper Bags: UV spot varnish (18 rows).
UPDATE variations AS v
SET v.delivery_options = '[{"days":20,"value":"15","type":"amount"}]',
    v.delivery_time_days = 20,
    v.delivery_price = 15,
    v.delivery_price_type = 'amount'
WHERE v.product_id = 287
  AND v.variation_id IN (2616, 2624, 2629, 2634, 2639, 2644, 2649, 2654, 2659, 2664, 2669, 2674, 2679, 2684, 2689, 2694, 2699, 2704);

-- Product 39: base price tiers, quantity below 1000 (80 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":5,"value":"5","type":"percentage"},{"days":10,"value":"0","type":"amount"},{"days":15,"value":"0","type":"amount"}]',
    p.delivery_time_days = 5,
    p.delivery_price = 5,
    p.delivery_price_type = 'percentage'
WHERE v.product_id = 39
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10164, 10165, 10166, 10167, 10172, 10173, 10174, 10175, 10180, 10181, 10182, 10183, 10188, 10189, 10190, 10191, 10227, 10228, 10229, 10230, 10235, 10236, 10237, 10238, 10243, 10244, 10245, 10246, 10251, 10252, 10253, 10254, 10290, 10291, 10292, 10293, 10294, 10295, 10300, 10301, 10302, 10303, 10304, 10305, 10310, 10311, 10312, 10313, 10314, 10315, 10321, 10322, 10323, 10324, 10325, 10326, 10331, 10332, 10333, 10334, 10335, 10336, 10341, 10342, 10343, 10344, 10345, 10346, 10351, 10352, 10353, 10354, 10355, 10356, 10362, 10363, 10364, 10365, 10366, 10367);

-- Product 39: base price tiers, quantity from 1000 (66 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":10,"value":"5","type":"percentage"},{"days":15,"value":"0","type":"amount"}]',
    p.delivery_time_days = 10,
    p.delivery_price = 5,
    p.delivery_price_type = 'percentage'
WHERE v.product_id = 39
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10168, 10169, 10170, 10171, 10176, 10177, 10178, 10179, 10184, 10185, 10186, 10187, 10192, 10193, 10194, 10195, 10231, 10232, 10233, 10234, 10239, 10240, 10241, 10242, 10247, 10248, 10249, 10250, 10255, 10256, 10257, 10258, 10296, 10297, 10298, 10299, 10306, 10307, 10308, 10309, 10316, 10317, 10318, 10319, 10320, 10327, 10328, 10329, 10330, 10337, 10338, 10339, 10340, 10347, 10348, 10349, 10350, 10357, 10358, 10359, 10360, 10361, 10368, 10369, 10370, 10371);

-- Product 281: base price tiers, quantity below 1000 (80 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":7,"value":"10","type":"amount"},{"days":12,"value":"5","type":"amount"},{"days":18,"value":"0","type":"amount"}]',
    p.delivery_time_days = 7,
    p.delivery_price = 10,
    p.delivery_price_type = 'amount'
WHERE v.product_id = 281
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10372, 10373, 10374, 10375, 10380, 10381, 10382, 10383, 10388, 10389, 10390, 10391, 10396, 10397, 10398, 10399, 10404, 10405, 10406, 10407, 10412, 10413, 10414, 10415, 10420, 10421, 10422, 10423, 10428, 10429, 10430, 10431, 10436, 10437, 10438, 10439, 10440, 10441, 10446, 10447, 10448, 10449, 10450, 10451, 10456, 10457, 10458, 10459, 10460, 10461, 10467, 10468, 10469, 10470, 10471, 10472, 10477, 10478, 10479, 10480, 10481, 10482, 10487, 10488, 10489, 10490, 10491, 10492, 10497, 10498, 10499, 10500, 10501, 10502, 10508, 10509, 10510, 10511, 10512, 10513);

-- Product 281: base price tiers, quantity from 1000 (66 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":12,"value":"15","type":"amount"},{"days":18,"value":"0","type":"amount"}]',
    p.delivery_time_days = 12,
    p.delivery_price = 15,
    p.delivery_price_type = 'amount'
WHERE v.product_id = 281
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10376, 10377, 10378, 10379, 10384, 10385, 10386, 10387, 10392, 10393, 10394, 10395, 10400, 10401, 10402, 10403, 10408, 10409, 10410, 10411, 10416, 10417, 10418, 10419, 10424, 10425, 10426, 10427, 10432, 10433, 10434, 10435, 10442, 10443, 10444, 10445, 10452, 10453, 10454, 10455, 10462, 10463, 10464, 10465, 10466, 10473, 10474, 10475, 10476, 10483, 10484, 10485, 10486, 10493, 10494, 10495, 10496, 10503, 10504, 10505, 10506, 10507, 10514, 10515, 10516, 10517);

-- Product 287: base price tiers, quantity 250-999 (36 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":15,"value":"5","type":"percentage"},{"days":20,"value":"0","type":"amount"}]',
    p.delivery_time_days = 15,
    p.delivery_price = 5,
    p.delivery_price_type = 'percentage'
WHERE v.product_id = 287
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10522, 10523, 10530, 10531, 10538, 10539, 10546, 10547, 10554, 10555, 10562, 10563, 10570, 10571, 10578, 10579, 10586, 10587, 10594, 10595, 10602, 10603, 10610, 10611, 10618, 10619, 10626, 10627, 10634, 10635, 10642, 10643, 10650, 10651, 10658, 10659);

-- Product 287: base price tiers, quantity 1000-4999 (54 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":15,"value":"10","type":"percentage"},{"days":20,"value":"0","type":"amount"}]',
    p.delivery_time_days = 15,
    p.delivery_price = 10,
    p.delivery_price_type = 'percentage'
WHERE v.product_id = 287
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10524, 10525, 10526, 10532, 10533, 10534, 10540, 10541, 10542, 10548, 10549, 10550, 10556, 10557, 10558, 10564, 10565, 10566, 10572, 10573, 10574, 10580, 10581, 10582, 10588, 10589, 10590, 10596, 10597, 10598, 10604, 10605, 10606, 10612, 10613, 10614, 10620, 10621, 10622, 10628, 10629, 10630, 10636, 10637, 10638, 10644, 10645, 10646, 10652, 10653, 10654, 10660, 10661, 10662);

-- Product 287: base price tiers, quantity from 5000 (54 rows).
UPDATE prices AS p
JOIN variations AS v ON v.variation_id = p.variation_id
SET p.delivery_options = '[{"days":20,"value":"0","type":"amount"}]',
    p.delivery_time_days = 20,
    p.delivery_price = 0,
    p.delivery_price_type = 'amount'
WHERE v.product_id = 287
  AND v.price_display_mode = 'prices'
  AND p.price IS NOT NULL
  AND p.price_id IN (10527, 10528, 10529, 10535, 10536, 10537, 10543, 10544, 10545, 10551, 10552, 10553, 10559, 10560, 10561, 10567, 10568, 10569, 10575, 10576, 10577, 10583, 10584, 10585, 10591, 10592, 10593, 10599, 10600, 10601, 10607, 10608, 10609, 10615, 10616, 10617, 10623, 10624, 10625, 10631, 10632, 10633, 10639, 10640, 10641, 10647, 10648, 10649, 10655, 10656, 10657, 10663, 10664, 10665);

COMMIT;
