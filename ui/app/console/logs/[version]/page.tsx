type SingleLogPageProps = { params: { version?: string }; searchParams: {} };

const SingleLogPage = (props: SingleLogPageProps) => {
  console.log("props", props);

  return <>The single logs {props.params?.version}</>;
};

export default SingleLogPage;
