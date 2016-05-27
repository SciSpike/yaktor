domain-model Test {
  node-mongo-options {
    model-path "test/"
    extensions {
    //this is not allowed because superOfAAndB is str
      A {
        single-table-root
      }
      superOfAAndB {
        single-table-root
      }
    }
  }
  entity Obj {
    GeoLocation loc
    Numeric notLocs*
  }
  entity Not {
  }
  //this should not be allowed
  //DOn't generate this
  abstract entity superOfAAndB {
    Id lid?
    ShortId sid "ASDFGHJKQWERTYUPZXCVBNM23456789" 2000000
    String ofA
    String title
    key ( sid )
  }
  entity A extends superOfAAndB {
  }
  entity B extends superOfAAndB {
    String ofB
  }
  abstract entity L {
  }
  entity M extends L {
  }
  abstract entity DSuper {
  }
  entity DefaultShort {
    ShortId s
    String name
    key(s)
  }
  entity D extends DSuper {
  //this is not allowed because a is not allowed to be a str because sub was a str
    ref A az
    //this is only allowed iff name matches storage because it's a str
    ref superOfAAndB subs
    //Not allowed if mongo
    //unless z is stored in zs
    ref Z yandZ
    //allowed because you can always reference an entity whos storage matches the entity name
    ref M m
    ref M m2?
    SubType subType
    SubType subTypes*
  }
  enum Values {
    One = "One"
  }
  type SubType {
    String field
    String afield?
  }
  entity Z {
    String patterned pattern "^pattern$"
    Numeric sized [ 1.0 .. 2.0 ]
    Numeric numerics*
    Date dates*
    String strings*
    Integer integers*
    String lengthed [ 1 .. 2 ]
    String patterndLength1 pattern "[a-z]*" [ 1 .. 2 ]
    String patterndLength2 pattern "[a-z]*" [ 1 .. 2 ]
    String required!
    enum Values valued!
  }
  //not allowed if mongo (perhaps loosened if we can join the collections)
  // Only allowed to extend

}