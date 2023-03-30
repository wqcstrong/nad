import { SVGAttributes } from 'react';

export const GitHubIcon = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      version='1.1'
      viewBox='0 0 1024 1024'
      {...props}
    >
      <path d='M 511 76 C 264 76 64 276 64 523 C 64 718 189 885 363 946 c 23 5 19 -10 19 -22 v -77 c -135 15 -141 -73 -150 -88 C 215 726 171 718 184 703 c 30 -15 62 4 98 57 c 26 39 77 32 104 26 c 5 -23 17 -44 34 -60 c -140 -25 -199 -111 -199 -213 c 0 -49 16 -95 48 -131 c -20 -60 1 -112 4 -120 c 58 -5 118 41 123 45 c 33 -8 70 -13 112 -13 c 42 0 80 4 113 13 c 11 -8 67 -48 121 -43 c 2 7 24 58 5 118 c 32 36 48 82 48 132 c 0 102 -59 188 -200 212 c 23 23 38 55 38 91 v 112 c 0 9 0 17 15 17 c 177 -59 304 -227 304 -424 c 0 -247 -200 -447 -447 -447 Z' />
    </svg>
  );
};
