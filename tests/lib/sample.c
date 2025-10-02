#include "sample.h"
#include <stdio.h>   // printf
#include <stdlib.h>  // malloc/free
#include <stddef.h>  // NULL
#include <emscripten/emscripten.h>

static sample1_t *sample1 = NULL;

EMSCRIPTEN_KEEPALIVE void init_sample1(void)
{
  sample1_t *p = (sample1_t *)malloc(sizeof(sample1_t));
  if (p) {
    p->a = 1;
    p->b = 2;
  }
  sample1 = p;
}

EMSCRIPTEN_KEEPALIVE sample1_t *get_sample1(void)
{
  return sample1;
}

EMSCRIPTEN_KEEPALIVE void print_sample1(void)
{
  if (sample1) {
    printf("sample1: a=%d, b=%d\n", sample1->a, sample1->b);
  } else {
    printf("sample1 is NULL\n");
  }
}

EMSCRIPTEN_KEEPALIVE void free_sample1(void)
{
  if (sample1) {
    free(sample1);
    sample1 = NULL;
  }
}
