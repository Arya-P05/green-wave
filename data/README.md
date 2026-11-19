# Data

## `toronto/spadina-2025-04-23.csv` and `spadina.json`

Turning movement counts from the City of Toronto's
[Traffic Volumes at Intersections for All Modes](https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/)
dataset (resource `tmc_raw_data_2020_2029.csv`): the 448 raw rows (8
intersections x 56 fifteen-minute bins, 06:00 to 20:00 Toronto time) for
eight consecutive signalized intersections on Spadina Avenue, all counted on
Wednesday 23 April 2025. The CSV is an unchanged subset of the source file.

Contains information licensed under the
[Open Government Licence – Toronto](https://open.toronto.ca/open-data-licence/).

`spadina.json` is derived by `scripts/toronto.ts`:

- Every vehicle (cars, trucks, buses) approaching from one side, whatever its
  turn, becomes demand on that approach. The model has no turns.
- Spadina demand per direction is the average over the eight intersections,
  split across its two general traffic lanes.
- Side-street demand is split across each approach's lanes at the stop line,
  read from OpenStreetMap (Overpass API, 18 Nov 2026). The script lists the
  OSM way and tag used for every approach. Map data © OpenStreetMap
  contributors, ODbL.
- Rates are cars per second per lane.

## `cliff.json`

Written by `scripts/cliff.ts` from the sim itself; no outside data.
