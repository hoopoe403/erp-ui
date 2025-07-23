export class HierarchicalKeyValue {
  id: number;
  item: string;
  parentId: number;
  children: Array<HierarchicalKeyValue>;
}

export class KeyValue {
  key: number;
  value: string;
}


export class Value {
  key: number;
  value: string;
  status: number;
}

export class KeyCount {
  key: number;
  count: number;
}

export class KeyCountItem {
  key: number;
  count: number;
  item: number;
}

export class Measure {
  key: number;
  itemId: number;
  name: string;
  measurementMetricId: number;
  code: string;
  categoryName: string;
  measure: number;
  unitId: number;
}

export class GoodsMeasure {
  key: number;
  itemId: number;
  name: string;
  code: string;
  categoryName: string;
  measure: number;
  unitId: number;
  conformityId: number;
  source: string;
  sourceColor: string;
}