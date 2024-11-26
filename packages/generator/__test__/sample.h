struct foo {
    struct {
        int a;
        int b;
    } bar;
};
struct bar {
    struct {
        unsigned int a;
        unsigned int b;
    };
};
int foo();
typedef float number;
int bar(number x);
struct Point
{
    number x;
    number y;
};
struct Angle
{
    number a;
    number b;
};
