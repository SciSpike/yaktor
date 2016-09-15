conversation test {
  type Type {
  }
  type A from Test.A {
  }
  type D2 from Test.D {
  }
  type Z from Test.Z {
  }
  type D from Test.D {
    az
    m
    subs
    subType {
    }
    yandZ
    subTypes {
      field
      afield
    }
    m2 {
    }

    Boolean isActive
  }
  agent test concerning Type {
    privately receives begin: D
    privately receives end

    initially receives custom begin -> begun {
      begun {
        end -> end
      }
      end {
      }
    }
  }
}