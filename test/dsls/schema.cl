conversation schema {
  type DefaultShort from Test.DefaultShort {
    name
    s
    ShortId y "(\\w)*"
    String p pattern "(\\w)*"
  }
  view /defaultshort over /defaultshort
  resource /defaultshort for schema.DefaultShort offers anonymous ( create ) interchanges ( json )
}