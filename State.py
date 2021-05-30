from enum import IntEnum
import inspect

class TYPE(IntEnum):
  DEFAULT = 1
  FOUND_AP = 2  # AP = augmenting path
  IMP_LAB = 3 # improved labelings 

class State():
  def __init__(self, type, labels, matching): # things needed in each state
    self.type = int(type)
    self.labels = [0] + labels[:] # python is default assign with reference
    self.matching =[0] + [i + 1 for i in matching]

  def serialize(self):
    return dict([p for p in inspect.getmembers(self) if not p[0].startswith('_') and  not inspect.ismethod(p[1])])

class Def_State(State):  # default
  def __init__(self, type, labels, matching):
    super().__init__(type, labels, matching)
  
  def print(self):
    print("{}, labels={}, matching={}".format(self.type, self.labels, self.matching))


class AP_State(State):  # augmenting path
  def __init__(self, type, labels, matching, path):
    super().__init__(type, labels, matching)
    self.path = [i + 1 for i in path] # adjust to 1-based
  
  def print(self):
    print("{}, path={}".format(self.type, self.path))


class Imp_Lab_State(State):  # improved labelings 
  def __init__(self, type,labels, matching, new_labels, d):
    super().__init__(type, labels, matching)
    self.new_labels, self.d = [0] + new_labels[:], d

  def print(self):
    print("{}, new_labels={}".format(self.type, self.new_labels))
