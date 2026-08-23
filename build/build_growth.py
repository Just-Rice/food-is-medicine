#!/usr/bin/env python3
"""Build data/growth.js from the CDC BMI-for-age growth chart data.

Adult BMI categories do not apply to anyone under 20: a child's healthy BMI
changes month by month as they grow, so the same number means different things
at 6 and at 16. CDC publishes the LMS parameters that define its growth charts,
and this script turns them into a lookup the site can use offline.

Source: CDC Growth Charts, "Percentile Data Files with LMS Values",
        BMI-for-age (2 to 20 years), bmiagerev.csv
        https://www.cdc.gov/growthcharts/cdc-data-files.htm

Usage: python3 build/build_growth.py <path to bmiagerev.csv>
"""
import csv, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'data', 'growth.js')


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: build_growth.py <bmiagerev.csv>')

    rows = {'male': [], 'female': []}
    with open(sys.argv[1]) as fh:
        for r in csv.DictReader(fh):
            sex = 'male' if r['Sex'].strip() == '1' else 'female'
            try:
                agemos = float(r['Agemos'])
                L, M, S = float(r['L']), float(r['M']), float(r['S'])
            except ValueError:
                continue
            rows[sex].append([round(agemos, 1), round(L, 6), round(M, 4), round(S, 6)])

    for sex in rows:
        rows[sex].sort(key=lambda x: x[0])

    with open(OUT, 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand.\n')
        fh.write('// Built by build/build_growth.py from the CDC BMI-for-age growth charts.\n')
        fh.write('// Each row is [age in months, L, M, S] -- the Box-Cox power, median and\n')
        fh.write('// coefficient of variation that define the CDC percentile curves.\n')
        fh.write('// Source: https://www.cdc.gov/growthcharts/cdc-data-files.htm\n')
        fh.write('window.GROWTH_LMS = ')
        json.dump(rows, fh, separators=(',', ':'))
        fh.write(';\n')

    print('wrote %d male / %d female rows -> %s'
          % (len(rows['male']), len(rows['female']), OUT))


if __name__ == '__main__':
    main()
